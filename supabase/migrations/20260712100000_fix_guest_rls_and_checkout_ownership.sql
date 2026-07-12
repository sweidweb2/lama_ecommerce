--------------------------------------------------
-- Fix guest RLS + checkout ownership
--
-- Goal:
-- - Remove world-readable/writable guest bypasses (user_id IS NULL)
-- - Authenticated users keep user_id = auth.uid() access
-- - Guest rows are accessed only via service_role from the app
--   (after validating the httpOnly guest_session_id cookie)
-- - Harden process_checkout ownership; revoke anon EXECUTE
-- - Revoke upsert_cart_item from anon
--------------------------------------------------

--------------------------------------------------
-- CARTS TABLE POLICIES
--------------------------------------------------

drop policy if exists "Users can read own carts" on carts;
create policy "Users can read own carts"
on carts
for select
using (
  deleted_at is null
  and user_id = auth.uid()
);

drop policy if exists "Users can insert own carts" on carts;
create policy "Users can insert own carts"
on carts
for insert
with check (
  user_id = auth.uid()
);

drop policy if exists "Users can update own carts" on carts;
create policy "Users can update own carts"
on carts
for update
using (
  deleted_at is null
  and user_id = auth.uid()
)
with check (
  deleted_at is null
  and user_id = auth.uid()
);

drop policy if exists "Users can delete own carts" on carts;
create policy "Users can delete own carts"
on carts
for delete
using (
  deleted_at is null
  and user_id = auth.uid()
);

--------------------------------------------------
-- CART ITEMS TABLE POLICIES
--------------------------------------------------

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
      and c.user_id = auth.uid()
  )
);

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
      and c.user_id = auth.uid()
  )
);

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
      and c.user_id = auth.uid()
  )
)
with check (
  deleted_at is null
  and exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.deleted_at is null
      and c.user_id = auth.uid()
  )
);

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
      and c.user_id = auth.uid()
  )
);

--------------------------------------------------
-- ORDERS TABLE POLICIES
--------------------------------------------------

drop policy if exists "Users can read own orders" on orders;
create policy "Users can read own orders"
on orders
for select
using (
  deleted_at is null
  and user_id = auth.uid()
);

drop policy if exists "Users can insert own orders" on orders;
create policy "Users can insert own orders"
on orders
for insert
with check (
  user_id = auth.uid()
);

drop policy if exists "Users can update own orders" on orders;
create policy "Users can update own orders"
on orders
for update
using (
  deleted_at is null
  and user_id = auth.uid()
)
with check (
  deleted_at is null
  and user_id = auth.uid()
);

drop policy if exists "Users can delete own orders" on orders;
create policy "Users can delete own orders"
on orders
for delete
using (
  deleted_at is null
  and user_id = auth.uid()
);

--------------------------------------------------
-- ORDER ITEMS TABLE POLICIES
--------------------------------------------------

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
      and o.user_id = auth.uid()
  )
);

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
      and o.user_id = auth.uid()
  )
);

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
      and o.user_id = auth.uid()
  )
)
with check (
  deleted_at is null
  and exists (
    select 1
    from orders o
    where o.id = order_id
      and o.deleted_at is null
      and o.user_id = auth.uid()
  )
);

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
      and o.user_id = auth.uid()
  )
);

--------------------------------------------------
-- WISHLIST POLICIES
--------------------------------------------------

drop policy if exists "Users and guests can read wishlist items" on wishlists;
drop policy if exists "Users and guests can insert wishlist items" on wishlists;
drop policy if exists "Users and guests can delete wishlist items" on wishlists;
drop policy if exists "Users can view own wishlist items" on wishlists;
drop policy if exists "Users can insert own wishlist items" on wishlists;
drop policy if exists "Users can delete own wishlist items" on wishlists;

create policy "Users can read own wishlist items"
on wishlists
for select
using (
  deleted_at is null
  and user_id = auth.uid()
);

create policy "Users can insert own wishlist items"
on wishlists
for insert
with check (
  user_id = auth.uid()
);

create policy "Users can delete own wishlist items"
on wishlists
for delete
using (
  deleted_at is null
  and user_id = auth.uid()
);

--------------------------------------------------
-- HARDEN process_checkout
--------------------------------------------------

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_cart_id       uuid,
  p_user_id       uuid       DEFAULT NULL,
  p_session_id    text       DEFAULT NULL,
  p_shipping_fee  numeric    DEFAULT 0,
  p_discount      numeric    DEFAULT 0,
  p_phone         text       DEFAULT NULL,
  p_email         text       DEFAULT NULL,
  p_address_snapshot jsonb   DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart           RECORD;
  v_item           RECORD;
  v_subtotal       numeric := 0;
  v_total          numeric;
  v_order_id       uuid;
  v_price          numeric;
  v_item_count     integer := 0;
BEGIN
  -- 1. Validate cart exists and is active
  SELECT * INTO v_cart
  FROM carts
  WHERE id = p_cart_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found or already deleted';
  END IF;

  -- 2. Validate ownership (authenticated cart OR guest session cart)
  IF v_cart.user_id IS NOT NULL THEN
    IF p_user_id IS NULL OR v_cart.user_id <> p_user_id THEN
      RAISE EXCEPTION 'Cart does not belong to this user';
    END IF;
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'Cart does not belong to this user';
    END IF;
  ELSIF v_cart.session_id IS NOT NULL THEN
    IF p_session_id IS NULL OR v_cart.session_id <> p_session_id THEN
      RAISE EXCEPTION 'Cart does not belong to this session';
    END IF;
  ELSE
    RAISE EXCEPTION 'Cart has no owner';
  END IF;

  -- 3. First pass: validate stock for ALL items before any mutation
  FOR v_item IN
    SELECT
      ci.id            AS ci_id,
      ci.customised_product_id,
      ci.quantity,
      cp.quantity_stock,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price          AS base_price,
      p.name           AS product_name
    FROM cart_items ci
    JOIN customised_products cp
      ON cp.id = ci.customised_product_id AND cp.deleted_at IS NULL
    JOIN products p
      ON p.id = cp.product_id AND p.deleted_at IS NULL
    WHERE ci.cart_id = p_cart_id
      AND ci.deleted_at IS NULL
  LOOP
    v_item_count := v_item_count + 1;

    IF v_item.quantity > v_item.quantity_stock THEN
      RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %',
        v_item.product_name, v_item.quantity, v_item.quantity_stock;
    END IF;

    v_price := COALESCE(v_item.price_override, v_item.base_price);
    v_subtotal := v_subtotal + (v_price * v_item.quantity);
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- 4. Calculate total
  v_total := v_subtotal + COALESCE(p_shipping_fee, 0) - COALESCE(p_discount, 0);
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  -- 5. Create order
  INSERT INTO orders (
    user_id, session_id, status,
    subtotal, shipping_fee, discount, total,
    payment_status,
    address_snapshot, phone, email
  )
  VALUES (
    p_user_id, p_session_id, 'pending',
    v_subtotal, COALESCE(p_shipping_fee, 0), COALESCE(p_discount, 0), v_total,
    'pending',
    p_address_snapshot, p_phone, p_email
  )
  RETURNING id INTO v_order_id;

  -- 6. Second pass: create order_items (snapshots) + decrement stock
  FOR v_item IN
    SELECT
      ci.id            AS ci_id,
      ci.customised_product_id,
      ci.quantity,
      cp.quantity_stock,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price          AS base_price,
      p.name           AS product_name
    FROM cart_items ci
    JOIN customised_products cp
      ON cp.id = ci.customised_product_id AND cp.deleted_at IS NULL
    JOIN products p
      ON p.id = cp.product_id AND p.deleted_at IS NULL
    WHERE ci.cart_id = p_cart_id
      AND ci.deleted_at IS NULL
  LOOP
    v_price := COALESCE(v_item.price_override, v_item.base_price);

    INSERT INTO order_items (
      order_id, customised_product_id, quantity,
      price_snapshot, product_name_snapshot,
      size_snapshot, material_snapshot, color_snapshot
    )
    VALUES (
      v_order_id, v_item.customised_product_id, v_item.quantity,
      v_price, v_item.product_name,
      v_item.size, v_item.material, v_item.color
    );

    UPDATE customised_products
    SET quantity_stock = quantity_stock - v_item.quantity
    WHERE id = v_item.customised_product_id
      AND quantity_stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock race condition for "%": stock changed since validation',
        v_item.product_name;
    END IF;
  END LOOP;

  -- 7. Soft-delete cart items
  UPDATE cart_items
  SET deleted_at = now()
  WHERE cart_id = p_cart_id
    AND deleted_at IS NULL;

  -- 8. Soft-delete cart
  UPDATE carts
  SET deleted_at = now()
  WHERE id = p_cart_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) TO service_role;

--------------------------------------------------
-- REVOKE upsert_cart_item FROM anon
--------------------------------------------------

REVOKE ALL ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO service_role;

NOTIFY pgrst, 'reload schema';
