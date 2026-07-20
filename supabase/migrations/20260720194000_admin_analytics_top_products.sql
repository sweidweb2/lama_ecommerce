-- Exact top products by revenue for Analytics (avoids PostgREST ~1000-row dumps).
-- Excludes cancelled orders; optional created_at range.
-- product_id is the name snapshot key (same as prior JS aggregate; rename-merge is P1).

create or replace function public.admin_top_products_by_revenue(
  p_limit integer default 10,
  p_from timestamptz default null,
  p_to_exclusive timestamptz default null
)
returns table (
  product_id text,
  product_name text,
  revenue numeric,
  order_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(trim(oi.product_name_snapshot), ''), 'Unknown Product') as product_id,
    coalesce(nullif(trim(oi.product_name_snapshot), ''), 'Unknown Product') as product_name,
    round(
      sum(coalesce(oi.price_snapshot, 0) * coalesce(oi.quantity, 0))::numeric,
      2
    ) as revenue,
    count(distinct oi.order_id)::bigint as order_count
  from order_items oi
  inner join orders o on o.id = oi.order_id
  where o.status <> 'cancelled'
    and (p_from is null or o.created_at >= p_from)
    and (p_to_exclusive is null or o.created_at < p_to_exclusive)
  group by 1, 2
  order by revenue desc
  limit greatest(coalesce(p_limit, 10), 1);
$$;

revoke all on function public.admin_top_products_by_revenue(integer, timestamptz, timestamptz) from public;
grant execute on function public.admin_top_products_by_revenue(integer, timestamptz, timestamptz) to service_role;
