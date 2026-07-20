-- Exact order revenue sum for Dashboard / Analytics.
-- PostgREST `total.sum()` is disabled on this project ("Use of aggregate functions is not allowed").
-- Excludes cancelled orders; optional created_at range (same rules as admin_top_products_by_revenue).

create or replace function public.admin_orders_revenue_sum(
  p_from timestamptz default null,
  p_to_exclusive timestamptz default null
)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    round(sum(o.total)::numeric, 2),
    0
  )
  from orders o
  where o.status <> 'cancelled'
    and (p_from is null or o.created_at >= p_from)
    and (p_to_exclusive is null or o.created_at < p_to_exclusive);
$$;

revoke all on function public.admin_orders_revenue_sum(timestamptz, timestamptz) from public;
grant execute on function public.admin_orders_revenue_sum(timestamptz, timestamptz) to service_role;
