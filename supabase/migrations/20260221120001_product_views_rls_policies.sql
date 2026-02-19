--------------------------------------------------
-- Product Views: RLS Policies
--
-- Goal: 
-- - Enable RLS on product_views table
-- - Allow users/guests to insert their own product views
-- - Allow admins full access (SELECT, INSERT, UPDATE, DELETE) for analytics
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
-- - auth.uid() for user identification
-- - session_id column (added in previous migration)
--------------------------------------------------

--------------------------------------------------
-- ENABLE RLS
--------------------------------------------------

alter table product_views enable row level security;

--------------------------------------------------
-- DROP EXISTING RLS POLICIES (if any)
--------------------------------------------------

drop policy if exists "Users and guests can insert product views" on product_views;
drop policy if exists "Admins can manage product views" on product_views;

--------------------------------------------------
-- NEW RLS POLICIES FOR PRODUCT_VIEWS
--------------------------------------------------

-- Users can insert their own product views (user_id = auth.uid())
-- Guests can insert product views where user_id is null (session_id handled in app code)
create policy "Users and guests can insert product views"
on product_views
for insert
with check (
  (user_id = auth.uid() or user_id is null)  -- Can create view for themselves or as guest
);

-- Admins can do all operations on product_views (for analytics and reporting)
create policy "Admins can manage product views"
on product_views
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);
