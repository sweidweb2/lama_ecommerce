--------------------------------------------------
-- RLS policies for tables that had RLS enabled
-- but no policies (deny-all for session clients).
--
-- Tables: payments, shipments, shipping_zones,
--         shipping_fees, promo_codes, product_stats
--------------------------------------------------

--------------------------------------------------
-- PAYMENTS
--------------------------------------------------
drop policy if exists "Users can read own payments" on payments;
create policy "Users can read own payments"
on payments
for select
to authenticated
using (
  exists (
    select 1
    from orders o
    where o.id = payments.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Admins can manage payments" on payments;
create policy "Admins can manage payments"
on payments
for all
to authenticated
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- SHIPMENTS
--------------------------------------------------
drop policy if exists "Users can read own shipments" on shipments;
create policy "Users can read own shipments"
on shipments
for select
to authenticated
using (
  exists (
    select 1
    from orders o
    where o.id = shipments.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Admins can manage shipments" on shipments;
create policy "Admins can manage shipments"
on shipments
for all
to authenticated
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- SHIPPING ZONES (public read for checkout)
--------------------------------------------------
drop policy if exists "Public can read shipping zones" on shipping_zones;
create policy "Public can read shipping zones"
on shipping_zones
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage shipping zones" on shipping_zones;
create policy "Admins can manage shipping zones"
on shipping_zones
for all
to authenticated
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- SHIPPING FEES (public read for checkout)
--------------------------------------------------
drop policy if exists "Public can read shipping fees" on shipping_fees;
create policy "Public can read shipping fees"
on shipping_fees
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage shipping fees" on shipping_fees;
create policy "Admins can manage shipping fees"
on shipping_fees
for all
to authenticated
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- PROMO CODES (admin only — no public read)
--------------------------------------------------
drop policy if exists "Admins can manage promo codes" on promo_codes;
create policy "Admins can manage promo codes"
on promo_codes
for all
to authenticated
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- PRODUCT STATS (admin only; increments via service role)
--------------------------------------------------
drop policy if exists "Admins can manage product stats" on product_stats;
create policy "Admins can manage product stats"
on product_stats
for all
to authenticated
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);
