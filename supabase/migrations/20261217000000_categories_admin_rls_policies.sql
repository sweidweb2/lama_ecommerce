--------------------------------------------------
-- Categories RLS Policies for Admins
--
-- Goal: Allow only admins to read, insert, update, and delete
--       rows in the `categories` table.
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
--------------------------------------------------

-- Admins can fully manage categories (CRUD)
create policy "Admins can manage categories"
on categories
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

