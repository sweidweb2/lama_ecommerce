-- Product view aggregate stats via SQL distinct counts (replaces JS Set + limit 10000)

CREATE OR REPLACE FUNCTION public.admin_product_views_stats()
RETURNS TABLE (
  total_views bigint,
  unique_products bigint,
  unique_users bigint,
  views_today bigint,
  views_this_week bigint,
  views_this_month bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Week bound matches prior JS: Sunday start (extract(dow): 0 = Sunday).
  WITH bounds AS (
    SELECT
      date_trunc('day', now()) AS start_of_today,
      date_trunc('day', now())
        - (extract(dow FROM now())::integer * interval '1 day') AS start_of_week,
      date_trunc('month', now()) AS start_of_month
  )
  SELECT
    count(*)::bigint AS total_views,
    count(DISTINCT product_id)::bigint AS unique_products,
    count(DISTINCT user_id)::bigint AS unique_users,
    count(*) FILTER (
      WHERE viewed_at >= (SELECT start_of_today FROM bounds)
    )::bigint AS views_today,
    count(*) FILTER (
      WHERE viewed_at >= (SELECT start_of_week FROM bounds)
    )::bigint AS views_this_week,
    count(*) FILTER (
      WHERE viewed_at >= (SELECT start_of_month FROM bounds)
    )::bigint AS views_this_month
  FROM public.product_views;
$$;

REVOKE ALL ON FUNCTION public.admin_product_views_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_product_views_stats() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_product_views_stats() TO service_role;

CREATE OR REPLACE FUNCTION public.admin_product_views_stats_by_product(
  p_product_id uuid
)
RETURNS TABLE (
  total_views bigint,
  unique_users bigint,
  guest_views bigint,
  views_today bigint,
  views_this_week bigint,
  views_this_month bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      date_trunc('day', now()) AS start_of_today,
      date_trunc('day', now())
        - (extract(dow FROM now())::integer * interval '1 day') AS start_of_week,
      date_trunc('month', now()) AS start_of_month
  )
  SELECT
    count(*)::bigint AS total_views,
    count(DISTINCT user_id)::bigint AS unique_users,
    count(*) FILTER (WHERE user_id IS NULL)::bigint AS guest_views,
    count(*) FILTER (
      WHERE viewed_at >= (SELECT start_of_today FROM bounds)
    )::bigint AS views_today,
    count(*) FILTER (
      WHERE viewed_at >= (SELECT start_of_week FROM bounds)
    )::bigint AS views_this_week,
    count(*) FILTER (
      WHERE viewed_at >= (SELECT start_of_month FROM bounds)
    )::bigint AS views_this_month
  FROM public.product_views
  WHERE product_id = p_product_id;
$$;

REVOKE ALL ON FUNCTION public.admin_product_views_stats_by_product(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_product_views_stats_by_product(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_product_views_stats_by_product(uuid) TO service_role;
