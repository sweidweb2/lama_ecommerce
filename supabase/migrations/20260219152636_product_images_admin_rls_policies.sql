--------------------------------------------------
-- Product Images RLS Policies for Admins
--
-- Goal: Allow only admins to read, insert, update, and delete
--       rows in the `product_images` table.
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
--------------------------------------------------

-- Admins can fully manage product images (CRUD)
create policy "Admins can manage product_images"
on product_images
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

