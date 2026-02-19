--------------------------------------------------
-- Wishlist: Add session_id and Update RLS Policies
--
-- Goal: 
-- - Add session_id column to wishlists table for guest users
-- - Add constraint ensuring either user_id or session_id is not null
-- - Update RLS policies to allow:
--   - Admins: full access (SELECT, INSERT, DELETE)
--   - Users: manage their own wishlist items (user_id = auth.uid())
--   - Guests: manage wishlist items where user_id is null (session_id handled in app code)
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
-- - auth.uid() for user identification
--------------------------------------------------

--------------------------------------------------
-- ALTER WISHLIST TABLE: Add session_id column
--------------------------------------------------

-- Add session_id column
alter table wishlists
add column session_id text;

-- Handle existing rows where user_id is null (if any)
-- Set a temporary session_id for existing null user_id rows to satisfy constraint
-- Note: This should not happen in practice, but we handle it for safety
update wishlists
set session_id = gen_random_uuid()::text
where user_id is null and session_id is null;

-- Add constraint: either user_id or session_id must be not null
alter table wishlists
add constraint wishlists_user_or_session_check
check (user_id is not null or session_id is not null);

-- Create index for session_id lookups
create index idx_wishlist_session_id on wishlists(session_id);

--------------------------------------------------
-- DROP EXISTING RLS POLICIES
--------------------------------------------------

-- Drop existing wishlist policies
drop policy if exists "Users can view own wishlist items" on wishlists;
drop policy if exists "Users can insert own wishlist items" on wishlists;
drop policy if exists "Users can delete own wishlist items" on wishlists;

--------------------------------------------------
-- ENABLE RLS (if not already enabled)
--------------------------------------------------

alter table wishlists enable row level security;

--------------------------------------------------
-- NEW RLS POLICIES FOR WISHLISTS
--------------------------------------------------

-- Users can read their own wishlist items (not deleted)
-- Guests can read wishlist items where user_id is null (session_id handled in app code)
create policy "Users and guests can read wishlist items"
on wishlists
for select
using (
  deleted_at is null
  and (
    user_id = auth.uid()  -- Authenticated users: their own wishlist items
    or user_id is null     -- Guests: wishlist items with no user_id (session_id handled in app)
  )
);

-- Users can insert their own wishlist items
-- Guests can insert wishlist items where user_id is null
create policy "Users and guests can insert wishlist items"
on wishlists
for insert
with check (
  (user_id = auth.uid() or user_id is null)  -- Can create wishlist item for themselves or as guest
);

-- Users can delete their own wishlist items (not deleted)
-- Guests can delete wishlist items where user_id is null
create policy "Users and guests can delete wishlist items"
on wishlists
for delete
using (
  deleted_at is null
  and (
    user_id = auth.uid()  -- Authenticated users: their own wishlist items
    or user_id is null    -- Guests: wishlist items with no user_id
  )
);

-- Admins can do all operations on wishlists
create policy "Admins can manage wishlists"
on wishlists
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);
