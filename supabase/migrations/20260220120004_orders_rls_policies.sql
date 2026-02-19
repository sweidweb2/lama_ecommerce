--------------------------------------------------
-- Orders & Order Items RLS Policies
--
-- Goal:
-- - Authenticated users can manage their own orders (orders.user_id = auth.uid())
-- - Guests can manage orders where user_id is null (session_id handled in app code)
-- - Admins can do all operations (SELECT, INSERT, UPDATE, DELETE)
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
-- - auth.uid() for user identification
--------------------------------------------------

--------------------------------------------------
-- ORDERS TABLE POLICIES
--------------------------------------------------

-- Users can read their own orders (not deleted)
drop policy if exists "Users can read own orders" on orders;
create policy "Users can read own orders"
on orders
for select
using (
  deleted_at is null
  and (
    user_id = auth.uid()      -- Authenticated users: their own orders
    or (user_id is null)      -- Guests: orders with no user_id (session_id handled in app)
  )
);

-- Users can insert their own orders (or as guests)
drop policy if exists "Users can insert own orders" on orders;
create policy "Users can insert own orders"
on orders
for insert
with check (
  (user_id = auth.uid() or user_id is null)  -- Can create order for themselves or as guest
);

-- Users can update their own orders
drop policy if exists "Users can update own orders" on orders;
create policy "Users can update own orders"
on orders
for update
using (
  deleted_at is null
  and (
    user_id = auth.uid()      -- Authenticated users: their own orders
    or (user_id is null)      -- Guests: orders with no user_id
  )
)
with check (
  deleted_at is null
  and (
    user_id = auth.uid()      -- Authenticated users: their own orders
    or (user_id is null)      -- Guests: orders with no user_id
  )
);

-- Users can delete their own orders (soft delete by setting deleted_at)
drop policy if exists "Users can delete own orders" on orders;
create policy "Users can delete own orders"
on orders
for delete
using (
  deleted_at is null
  and (
    user_id = auth.uid()      -- Authenticated users: their own orders
    or (user_id is null)      -- Guests: orders with no user_id
  )
);

-- Admins can do all operations on orders
drop policy if exists "Admins can manage orders" on orders;
create policy "Admins can manage orders"
on orders
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- ORDER ITEMS TABLE POLICIES
--------------------------------------------------

-- Users can read order items from their own orders (not deleted)
drop policy if exists "Users can read own order items" on order_items;
create policy "Users can read own order items"
on order_items
for select
using (
  deleted_at is null
  and exists (
    select 1
    from orders o
    where o.id = order_items.order_id
      and o.deleted_at is null
      and (
        o.user_id = auth.uid()    -- Authenticated users: their own orders
        or o.user_id is null      -- Guests: orders with no user_id (session_id handled in app)
      )
  )
);

-- Users can insert order items into their own orders
drop policy if exists "Users can insert own order items" on order_items;
create policy "Users can insert own order items"
on order_items
for insert
with check (
  exists (
    select 1
    from orders o
    where o.id = order_id
      and o.deleted_at is null
      and (
        o.user_id = auth.uid()    -- Authenticated users: their own orders
        or o.user_id is null      -- Guests: orders with no user_id
      )
  )
);

-- Users can update order items in their own orders
drop policy if exists "Users can update own order items" on order_items;
create policy "Users can update own order items"
on order_items
for update
using (
  deleted_at is null
  and exists (
    select 1
    from orders o
    where o.id = order_id
      and o.deleted_at is null
      and (
        o.user_id = auth.uid()    -- Authenticated users: their own orders
        or o.user_id is null      -- Guests: orders with no user_id
      )
  )
)
with check (
  deleted_at is null
  and exists (
    select 1
    from orders o
    where o.id = order_id
      and o.deleted_at is null
      and (
        o.user_id = auth.uid()    -- Authenticated users: their own orders
        or o.user_id is null      -- Guests: orders with no user_id
      )
  )
);

-- Users can delete order items from their own orders (soft delete by setting deleted_at)
drop policy if exists "Users can delete own order items" on order_items;
create policy "Users can delete own order items"
on order_items
for delete
using (
  deleted_at is null
  and exists (
    select 1
    from orders o
    where o.id = order_id
      and o.deleted_at is null
      and (
        o.user_id = auth.uid()    -- Authenticated users: their own orders
        or o.user_id is null      -- Guests: orders with no user_id
      )
  )
);

-- Admins can do all operations on order items
drop policy if exists "Admins can manage order items" on order_items;
create policy "Admins can manage order items"
on order_items
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

