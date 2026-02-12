--------------------------------------------------
-- Products RLS Policies for Admins
--
-- Goal: Allow only admins to read, insert, update,
--       and delete rows in the `products` table.
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
--------------------------------------------------

-- Safe to re-run: drop if exists
drop policy if exists "Admins can manage products" on products;

-- Admins can fully manage products (CRUD)
create policy "Admins can manage products"
on products
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);