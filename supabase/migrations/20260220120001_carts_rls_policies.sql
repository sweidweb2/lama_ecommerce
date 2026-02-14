--------------------------------------------------
-- Carts & Cart Items RLS Policies
--
-- Goal: 
-- - Users can manage their own carts (user_id = auth.uid())
-- - Guests can manage carts where user_id is null (session_id handled in app code)
-- - Admins can do all operations (SELECT, INSERT, UPDATE, DELETE)
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
-- - auth.uid() for user identification
--------------------------------------------------

--------------------------------------------------
-- CARTS TABLE POLICIES
--------------------------------------------------

-- Users can read their own carts (not deleted)
drop policy if exists "Users can read own carts" on carts;
create policy "Users can read own carts"
on carts
for select
using (
  deleted_at is null
  and (
    user_id = auth.uid()  -- Authenticated users: their own carts
    or (user_id is null)  -- Guests: carts with no user_id (session_id handled in app)
  )
);

-- Users can insert their own carts
drop policy if exists "Users can insert own carts" on carts;
create policy "Users can insert own carts"
on carts
for insert
with check (
  (user_id = auth.uid() or user_id is null)  -- Can create cart for themselves or as guest
);

-- Users can update their own carts
drop policy if exists "Users can update own carts" on carts;
create policy "Users can update own carts"
on carts
for update
using (
  deleted_at is null
  and (
    user_id = auth.uid()  -- Authenticated users: their own carts
    or (user_id is null)  -- Guests: carts with no user_id
  )
)
with check (
  deleted_at is null
  and (
    user_id = auth.uid()  -- Authenticated users: their own carts
    or (user_id is null)  -- Guests: carts with no user_id
  )
);

-- Users can delete their own carts (soft delete by setting deleted_at)
drop policy if exists "Users can delete own carts" on carts;
create policy "Users can delete own carts"
on carts
for delete
using (
  deleted_at is null
  and (
    user_id = auth.uid()  -- Authenticated users: their own carts
    or (user_id is null)  -- Guests: carts with no user_id
  )
);

-- Admins can do all operations on carts
drop policy if exists "Admins can manage carts" on carts;
create policy "Admins can manage carts"
on carts
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- CART ITEMS TABLE POLICIES
--------------------------------------------------

-- Users can read cart items from their own carts (not deleted)
drop policy if exists "Users can read own cart items" on cart_items;
create policy "Users can read own cart items"
on cart_items
for select
using (
  deleted_at is null
  and exists (
    select 1
    from carts c
    where c.id = cart_items.cart_id
      and c.deleted_at is null
      and (
        c.user_id = auth.uid()  -- Authenticated users: their own carts
        or c.user_id is null    -- Guests: carts with no user_id
      )
  )
);

-- Users can insert cart items into their own carts
drop policy if exists "Users can insert own cart items" on cart_items;
create policy "Users can insert own cart items"
on cart_items
for insert
with check (
  exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.deleted_at is null
      and (
        c.user_id = auth.uid()  -- Authenticated users: their own carts
        or c.user_id is null    -- Guests: carts with no user_id
      )
  )
);

-- Users can update cart items in their own carts
drop policy if exists "Users can update own cart items" on cart_items;
create policy "Users can update own cart items"
on cart_items
for update
using (
  deleted_at is null
  and exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.deleted_at is null
      and (
        c.user_id = auth.uid()  -- Authenticated users: their own carts
        or c.user_id is null    -- Guests: carts with no user_id
      )
  )
)
with check (
  deleted_at is null
  and exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.deleted_at is null
      and (
        c.user_id = auth.uid()  -- Authenticated users: their own carts
        or c.user_id is null    -- Guests: carts with no user_id
      )
  )
);

-- Users can delete cart items from their own carts (soft delete by setting deleted_at)
drop policy if exists "Users can delete own cart items" on cart_items;
create policy "Users can delete own cart items"
on cart_items
for delete
using (
  deleted_at is null
  and exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.deleted_at is null
      and (
        c.user_id = auth.uid()  -- Authenticated users: their own carts
        or c.user_id is null    -- Guests: carts with no user_id
      )
  )
);

-- Admins can do all operations on cart items
drop policy if exists "Admins can manage cart items" on cart_items;
create policy "Admins can manage cart items"
on cart_items
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);
