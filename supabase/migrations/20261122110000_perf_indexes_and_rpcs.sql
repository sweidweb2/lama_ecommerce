-- Performance: hot-path indexes + aggregate/increment RPCs

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_product_viewed_at ON public.product_views (product_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_status_created_at ON public.reviews (review_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_active_created_at ON public.profiles (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_active_slug ON public.categories (slug) WHERE is_active = true AND slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_active ON public.products (category_id, is_active) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_questions_unanswered ON public.product_questions (created_at DESC) WHERE is_approved = true;

CREATE OR REPLACE FUNCTION public.increment_product_stat(
  p_product_id uuid,
  p_column text,
  p_delta integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'p_product_id is required';
  END IF;
  IF p_delta IS NULL OR p_delta < 1 THEN
    RAISE EXCEPTION 'p_delta must be >= 1';
  END IF;
  IF p_column IS NULL OR p_column NOT IN (
    'views_count',
    'add_to_cart_count',
    'purchase_count'
  ) THEN
    RAISE EXCEPTION 'p_column must be views_count, add_to_cart_count, or purchase_count';
  END IF;

  IF p_column = 'views_count' THEN
    INSERT INTO public.product_stats AS ps (
      product_id, views_count, add_to_cart_count, purchase_count
    )
    VALUES (p_product_id, p_delta, 0, 0)
    ON CONFLICT (product_id) DO UPDATE
      SET views_count = ps.views_count + EXCLUDED.views_count;
  ELSIF p_column = 'add_to_cart_count' THEN
    INSERT INTO public.product_stats AS ps (
      product_id, views_count, add_to_cart_count, purchase_count
    )
    VALUES (p_product_id, 0, p_delta, 0)
    ON CONFLICT (product_id) DO UPDATE
      SET add_to_cart_count = ps.add_to_cart_count + EXCLUDED.add_to_cart_count;
  ELSE
    INSERT INTO public.product_stats AS ps (
      product_id, views_count, add_to_cart_count, purchase_count
    )
    VALUES (p_product_id, 0, 0, p_delta)
    ON CONFLICT (product_id) DO UPDATE
      SET purchase_count = ps.purchase_count + EXCLUDED.purchase_count;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.increment_product_stat(uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_product_stat(uuid, text, integer) FROM anon;
REVOKE ALL ON FUNCTION public.increment_product_stat(uuid, text, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_product_stat(uuid, text, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.get_category_product_counts(
  p_category_ids uuid[] DEFAULT NULL,
  p_active_only boolean DEFAULT false
)
RETURNS TABLE (category_id uuid, product_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.category_id,
    count(*)::bigint AS product_count
  FROM public.products p
  WHERE p.category_id IS NOT NULL
    AND (p_category_ids IS NULL OR p.category_id = ANY (p_category_ids))
    AND (NOT p_active_only OR p.is_active = true)
  GROUP BY p.category_id;
$$;
REVOKE ALL ON FUNCTION public.get_category_product_counts(uuid[], boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_category_product_counts(uuid[], boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_category_product_counts(uuid[], boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_category_product_counts(uuid[], boolean) TO anon;

CREATE OR REPLACE FUNCTION public.get_home_categories()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  product_count bigint,
  image_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH cats AS (
    SELECT c.id, c.name, c.slug
    FROM public.categories c
    WHERE c.is_active = true
      AND c.slug IS NOT NULL
      AND length(trim(c.slug)) > 0
  ),
  counts AS (
    SELECT p.category_id, count(*)::bigint AS product_count
    FROM public.products p
    WHERE p.is_active = true
      AND p.category_id IN (SELECT cats.id FROM cats)
    GROUP BY p.category_id
  ),
  covers AS (
    SELECT DISTINCT ON (p.category_id)
      p.category_id,
      pi.url_image AS image_url
    FROM public.products p
    INNER JOIN public.product_images pi ON pi.product_id = p.id
    WHERE p.is_active = true
      AND p.category_id IN (SELECT cats.id FROM cats)
    ORDER BY
      p.category_id,
      pi.is_primary DESC NULLS LAST,
      p.created_at DESC NULLS LAST
  )
  SELECT
    cats.id,
    cats.name,
    cats.slug,
    coalesce(counts.product_count, 0)::bigint AS product_count,
    covers.image_url
  FROM cats
  LEFT JOIN counts ON counts.category_id = cats.id
  LEFT JOIN covers ON covers.category_id = cats.id
  ORDER BY cats.name ASC;
$$;
REVOKE ALL ON FUNCTION public.get_home_categories() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_home_categories() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_home_categories() TO anon;

CREATE OR REPLACE FUNCTION public.admin_order_status_counts()
RETURNS TABLE (status public.order_status, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.status, count(*)::bigint
  FROM public.orders o
  GROUP BY o.status;
$$;

CREATE OR REPLACE FUNCTION public.admin_payment_status_counts()
RETURNS TABLE (status public.payment_status, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.payment_status AS status, count(*)::bigint
  FROM public.orders o
  GROUP BY o.payment_status;
$$;

CREATE OR REPLACE FUNCTION public.admin_orders_by_month(
  p_from timestamptz,
  p_to_exclusive timestamptz
)
RETURNS TABLE (month text, orders bigint, sales numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      date_trunc('month', p_from AT TIME ZONE 'UTC') AS start_month,
      date_trunc(
        'month',
        (p_to_exclusive - interval '1 microsecond') AT TIME ZONE 'UTC'
      ) AS end_month
  ),
  months AS (
    SELECT generate_series(
      (SELECT start_month FROM bounds),
      (SELECT end_month FROM bounds),
      interval '1 month'
    ) AS month_start
  )
  SELECT
    to_char(m.month_start, 'YYYY-MM') AS month,
    count(o.id) FILTER (WHERE o.status <> 'cancelled')::bigint AS orders,
    coalesce(
      round(
        sum(o.total) FILTER (WHERE o.status <> 'cancelled')::numeric,
        2
      ),
      0
    ) AS sales
  FROM months m
  LEFT JOIN public.orders o
    ON o.created_at >= (m.month_start AT TIME ZONE 'UTC')
   AND o.created_at < ((m.month_start + interval '1 month') AT TIME ZONE 'UTC')
  GROUP BY m.month_start
  ORDER BY m.month_start;
$$;

CREATE OR REPLACE FUNCTION public.admin_users_by_month(
  p_from timestamptz,
  p_to_exclusive timestamptz
)
RETURNS TABLE (month text, users bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      date_trunc('month', p_from AT TIME ZONE 'UTC') AS start_month,
      date_trunc(
        'month',
        (p_to_exclusive - interval '1 microsecond') AT TIME ZONE 'UTC'
      ) AS end_month
  ),
  months AS (
    SELECT generate_series(
      (SELECT start_month FROM bounds),
      (SELECT end_month FROM bounds),
      interval '1 month'
    ) AS month_start
  )
  SELECT
    to_char(m.month_start, 'YYYY-MM') AS month,
    count(p.id)::bigint AS users
  FROM months m
  LEFT JOIN public.profiles p
    ON p.is_active = true
   AND p.created_at >= (m.month_start AT TIME ZONE 'UTC')
   AND p.created_at < ((m.month_start + interval '1 month') AT TIME ZONE 'UTC')
  GROUP BY m.month_start
  ORDER BY m.month_start;
$$;

REVOKE ALL ON FUNCTION public.admin_order_status_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_order_status_counts() TO service_role;
REVOKE ALL ON FUNCTION public.admin_payment_status_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_payment_status_counts() TO service_role;
REVOKE ALL ON FUNCTION public.admin_orders_by_month(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_orders_by_month(timestamptz, timestamptz) TO service_role;
REVOKE ALL ON FUNCTION public.admin_users_by_month(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_users_by_month(timestamptz, timestamptz) TO service_role;

NOTIFY pgrst, 'reload schema';
