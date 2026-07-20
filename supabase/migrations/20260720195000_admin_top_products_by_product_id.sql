-- Aggregate top products by real product UUID (via customised_products), not name snapshot.
-- Return type changes → DROP first.

DROP FUNCTION IF EXISTS public.admin_top_products_by_revenue(integer, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.admin_top_products_by_revenue(
  p_limit integer DEFAULT 10,
  p_from timestamptz DEFAULT NULL,
  p_to_exclusive timestamptz DEFAULT NULL
)
RETURNS TABLE (
  product_id text,
  product_name text,
  revenue numeric,
  order_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    keyed.product_id,
    MAX(keyed.product_name) AS product_name,
    ROUND(
      SUM(COALESCE(keyed.price_snapshot, 0) * COALESCE(keyed.quantity, 0))::numeric,
      2
    ) AS revenue,
    COUNT(DISTINCT keyed.order_id)::bigint AS order_count
  FROM (
    SELECT
      oi.order_id,
      oi.price_snapshot,
      oi.quantity,
      COALESCE(
        cp.product_id::text,
        'orphan:' || COALESCE(NULLIF(TRIM(oi.product_name_snapshot), ''), 'unknown')
      ) AS product_id,
      COALESCE(
        NULLIF(TRIM(p.name), ''),
        NULLIF(TRIM(oi.product_name_snapshot), ''),
        'Unknown Product'
      ) AS product_name
    FROM public.order_items oi
    INNER JOIN public.orders o ON o.id = oi.order_id
    LEFT JOIN public.customised_products cp ON cp.id = oi.customised_product_id
    LEFT JOIN public.products p ON p.id = cp.product_id
    WHERE o.status <> 'cancelled'
      AND (p_from IS NULL OR o.created_at >= p_from)
      AND (p_to_exclusive IS NULL OR o.created_at < p_to_exclusive)
  ) keyed
  GROUP BY keyed.product_id
  ORDER BY revenue DESC
  LIMIT GREATEST(COALESCE(p_limit, 10), 1);
$$;

REVOKE ALL ON FUNCTION public.admin_top_products_by_revenue(integer, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_top_products_by_revenue(integer, timestamptz, timestamptz) TO service_role;
