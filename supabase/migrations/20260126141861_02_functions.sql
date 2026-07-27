-- Functions (RPCs / helpers)

-- Split from consolidated schema migration. Fresh DB reset only.



-- ----- functions -----

-- --------------------------------------------------
-- TRIGGERS
-- --------------------------------------------------

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =============================================================================
-- Source: 20260201000000_profiles_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- Fragment 2.2: Profiles RLS Policies
-- 
-- Goal: Database enforces access; frontend cannot bypass it.
--
-- Global Auth Assumptions:
-- - auth.uid() Ã¢â€ â€™ current authenticated user ID
-- - User role is read from profiles.role
-- - Never trust a role coming from the frontend
--------------------------------------------------

--------------------------------------------------
-- Helper Function: Get Current User Role
-- 
-- This function retrieves the role of the currently authenticated user
-- from the profiles table. Used in RLS policies that need role-based checks.
--
-- Returns:
-- - 'user' | 'admin' | null (if user not found or not authenticated)
--------------------------------------------------
create or replace function public.get_user_role()
returns profile_role as $$
declare
  user_role profile_role;
begin
  select role into user_role
  from public.profiles
  where user_id = auth.uid()
  limit 1;
  
  return coalesce(user_role, 'user'::profile_role);
end;
$$ language plpgsql security definer stable;

--------------------------------------------------
-- Trigger: Prevent Users from Changing Own Role
-- 
-- This trigger ensures users cannot change their own role.
-- Only admins (via service role) can change user roles.
--------------------------------------------------
create or replace function public.prevent_role_change()
returns trigger as $$
begin
  -- If the role is being changed and the user is updating their own profile
  if old.role is distinct from new.role 
     and new.user_id = auth.uid() 
     and old.user_id = auth.uid() then
    -- Prevent the role change
    raise exception 'Users cannot change their own role. Contact an administrator.';
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

--------------------------------------------------
-- Function: get_admin_profiles()
-- Returns profile rows plus email from auth.users.
-- Only executable by admins; otherwise returns no rows.
--------------------------------------------------
create or replace function public.get_admin_profiles()
returns table (
  id uuid,
  user_id uuid,
  full_name text,
  role profile_role,
  created_at timestamptz,
  is_active boolean,
  email text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_user_role() != 'admin'::profile_role then
    return;
  end if;
  return query
  select
    p.id,
    p.user_id,
    p.full_name,
    p.role,
    p.created_at,
    p.is_active,
    u.email::text
  from public.profiles p
  join auth.users u on u.id = p.user_id;
end;
$$;

--------------------------------------------------
-- UPSERT CART ITEM FUNCTION
-- Atomically adds or updates cart item with stock validation
-- Must be in public schema for Supabase RPC to find it
--------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_cart_item(
  p_cart_id uuid,
  p_customised_product_id uuid,
  p_quantity integer
)
RETURNS SETOF cart_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_stock integer;
  v_existing_quantity integer;
  v_new_quantity integer;
  v_result RECORD;
BEGIN
  -- 1. Validate stock availability
  SELECT quantity_stock INTO v_available_stock
  FROM customised_products
  WHERE id = p_customised_product_id;
  
  IF v_available_stock IS NULL THEN
    RAISE EXCEPTION 'Product variant not found';
  END IF;
  
  IF v_available_stock <= 0 THEN
    RAISE EXCEPTION 'Product variant is out of stock';
  END IF;
  
  -- 2. Try to update existing cart item
  UPDATE cart_items
  SET quantity = quantity + p_quantity
  WHERE cart_id = p_cart_id
    AND customised_product_id = p_customised_product_id
  RETURNING * INTO v_result;
  
  -- 3. If no row was updated, insert new cart item
  IF NOT FOUND THEN
    -- Validate quantity doesn't exceed stock before inserting
    IF p_quantity > v_available_stock THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', 
        v_available_stock, p_quantity;
    END IF;
    
    INSERT INTO cart_items (cart_id, customised_product_id, quantity)
    VALUES (p_cart_id, p_customised_product_id, p_quantity)
    RETURNING * INTO v_result;
  ELSE
    -- Row was updated, validate final quantity doesn't exceed stock
    IF v_result.quantity > v_available_stock THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', 
        v_available_stock, v_result.quantity;
    END IF;
  END IF;
  
  -- 6. Return the result from the table (avoids ambiguous column references)
  RETURN QUERY
  SELECT *
  FROM cart_items
  WHERE id = v_result.id;
END;
$$;

-- =============================================================================
-- Source: 20260220120005_checkout_function.sql
-- =============================================================================

--------------------------------------------------
-- Checkout Function Ã¢â‚¬â€œ Atomic Order Creation
--
-- Goal:
-- - Validate stock for all cart items
-- - Create order + order_items (snapshots)
-- - Decrement stock atomically
-- - Soft-delete cart + cart_items
-- - Handle both logged-in users and guests
--
-- Depends on:
-- - carts, cart_items, orders, order_items, customised_products, products
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
RETURNS uuid -- returns the new order id
LANGUAGE plpgsql
SECURITY DEFINER
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
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  -- 2. Validate ownership
  IF p_user_id IS NOT NULL AND v_cart.user_id IS NOT NULL
     AND v_cart.user_id != p_user_id THEN
    RAISE EXCEPTION 'Cart does not belong to this user';
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
      ON cp.id = ci.customised_product_id
    JOIN products p
      ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
     
  LOOP
    v_item_count := v_item_count + 1;

    IF v_item.quantity > v_item.quantity_stock THEN
      RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %',
        v_item.product_name, v_item.quantity, v_item.quantity_stock;
    END IF;

    -- Accumulate subtotal (use price_override if set, else base_price)
    v_price := COALESCE(v_item.price_override, v_item.base_price);
    v_subtotal := v_subtotal + (v_price * v_item.quantity);
  END LOOP;

  -- Cart must have items
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
      ON cp.id = ci.customised_product_id
    JOIN products p
      ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
     
  LOOP
    v_price := COALESCE(v_item.price_override, v_item.base_price);

    -- Insert snapshot order item
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

    -- Decrement stock atomically (will fail if another transaction took the stock)
    UPDATE customised_products
    SET quantity_stock = quantity_stock - v_item.quantity
    WHERE id = v_item.customised_product_id
      AND quantity_stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock race condition for "%": stock changed since validation',
        v_item.product_name;
    END IF;
  END LOOP;

  -- 7. Hard-delete cart (cart_items CASCADE)
  DELETE FROM carts
  WHERE id = p_cart_id;

  RETURN v_order_id;
END;
$$;

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
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
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
      ON cp.id = ci.customised_product_id
    JOIN products p
      ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
     
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
      ON cp.id = ci.customised_product_id
    JOIN products p
      ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
     
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

  -- 7. Hard-delete cart (cart_items CASCADE)
  DELETE FROM carts
  WHERE id = p_cart_id;

  RETURN v_order_id;
END;
$$;

-- ============================================================
-- Source: 20260712200000_lock_get_user_role_search_path.sql
-- ============================================================

--------------------------------------------------
-- Lock search_path on get_user_role()
--
-- SECURITY DEFINER helpers must pin search_path to avoid
-- search_path hijacking / object shadowing attacks.
--------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS profile_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role profile_role;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  RETURN coalesce(user_role, 'user'::profile_role);
END;
$$;

-- 5. Recreate get_admin_profiles with is_active
-- Must DROP first: CREATE OR REPLACE cannot change RETURNS TABLE shape
DROP FUNCTION IF EXISTS public.get_admin_profiles();

CREATE OR REPLACE FUNCTION public.get_admin_profiles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  role profile_role,
  created_at timestamptz,
  is_active boolean,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_user_role() != 'admin'::profile_role THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.full_name,
    p.role,
    p.created_at,
    p.is_active,
    u.email::text
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id;
END;
$$;

-- 6. Recreate upsert_cart_item without deleted_at
-- DROP first: SETOF cart_items shape changed after column drop
DROP FUNCTION IF EXISTS public.upsert_cart_item(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION public.upsert_cart_item(
  p_cart_id uuid,
  p_customised_product_id uuid,
  p_quantity integer
)
RETURNS SETOF cart_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available_stock integer;
  v_result RECORD;
BEGIN
  SELECT quantity_stock INTO v_available_stock
  FROM customised_products
  WHERE id = p_customised_product_id;

  IF v_available_stock IS NULL THEN
    RAISE EXCEPTION 'Product variant not found';
  END IF;

  IF v_available_stock <= 0 THEN
    RAISE EXCEPTION 'Product variant is out of stock';
  END IF;

  UPDATE cart_items
  SET quantity = quantity + p_quantity
  WHERE cart_id = p_cart_id
    AND customised_product_id = p_customised_product_id
  RETURNING * INTO v_result;

  IF NOT FOUND THEN
    IF p_quantity > v_available_stock THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %',
        v_available_stock, p_quantity;
    END IF;

    INSERT INTO cart_items (cart_id, customised_product_id, quantity)
    VALUES (p_cart_id, p_customised_product_id, p_quantity)
    RETURNING * INTO v_result;
  ELSE
    IF v_result.quantity > v_available_stock THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %',
        v_available_stock, v_result.quantity;
    END IF;
  END IF;

  RETURN QUERY
  SELECT *
  FROM cart_items
  WHERE id = v_result.id;
END;
$$;

-- 7. process_checkout: hard-delete cart (preserve ownership checks from prior migration)
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
  SELECT * INTO v_cart
  FROM carts
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

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
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
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

  v_total := v_subtotal + COALESCE(p_shipping_fee, 0) - COALESCE(p_discount, 0);
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

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

  FOR v_item IN
    SELECT
      ci.customised_product_id,
      ci.quantity,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price AS base_price,
      p.name AS product_name
    FROM cart_items ci
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
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

  DELETE FROM carts WHERE id = p_cart_id;

  RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restock_order_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  should_restock boolean := false;
BEGIN
  -- Already restored (e.g. cancelled then later marked refunded)
  IF OLD.stock_restored THEN
    NEW.stock_restored := true;
    RETURN NEW;
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    should_restock := true;
  END IF;

  IF NEW.payment_status IN ('failed', 'refunded')
     AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    should_restock := true;
  END IF;

  IF should_restock THEN
    UPDATE public.customised_products cp
    SET quantity_stock = cp.quantity_stock + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.customised_product_id IS NOT NULL
      AND cp.id = oi.customised_product_id;

    NEW.stock_restored := true;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- Source: 20260713130000_process_checkout_resolve_shipping.sql
-- ============================================================

-- Harden process_checkout: resolve shipping fee from zone id inside SQL.
-- Remove trusted p_shipping_fee / p_discount money args; force discount = 0
-- until promo codes are wired into checkout.

DROP FUNCTION IF EXISTS public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_cart_id            uuid,
  p_shipping_zone_id   uuid,
  p_user_id            uuid       DEFAULT NULL,
  p_session_id         text       DEFAULT NULL,
  p_phone              text       DEFAULT NULL,
  p_email              text       DEFAULT NULL,
  p_address_snapshot   jsonb      DEFAULT NULL
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
  v_shipping_fee   numeric := 0;
  v_discount       numeric := 0;
  v_total          numeric;
  v_order_id       uuid;
  v_price          numeric;
  v_item_count     integer := 0;
BEGIN
  SELECT * INTO v_cart
  FROM carts
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

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
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
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

  -- Resolve shipping fee from zone (first fee row by created_at ASC)
  SELECT COALESCE(sf.fee, 0)
  INTO v_shipping_fee
  FROM shipping_zones sz
  LEFT JOIN LATERAL (
    SELECT fee
    FROM shipping_fees
    WHERE zone_id = sz.id
    ORDER BY created_at ASC
    LIMIT 1
  ) sf ON true
  WHERE sz.id = p_shipping_zone_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid shipping zone';
  END IF;

  -- Promo codes not wired into checkout yet
  v_discount := 0;

  v_total := v_subtotal + v_shipping_fee - v_discount;
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  INSERT INTO orders (
    user_id, session_id, status,
    subtotal, shipping_fee, discount, total,
    payment_status,
    address_snapshot, phone, email
  )
  VALUES (
    p_user_id, p_session_id, 'pending',
    v_subtotal, v_shipping_fee, v_discount, v_total,
    'pending',
    p_address_snapshot, p_phone, p_email
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN
    SELECT
      ci.customised_product_id,
      ci.quantity,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price AS base_price,
      p.name AS product_name
    FROM cart_items ci
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
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

  DELETE FROM carts WHERE id = p_cart_id;

  RETURN v_order_id;
END;
$$;

DROP FUNCTION IF EXISTS public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_cart_id            uuid,
  p_shipping_zone_id   uuid,
  p_user_id            uuid       DEFAULT NULL,
  p_session_id         text       DEFAULT NULL,
  p_phone              text       DEFAULT NULL,
  p_email              text       DEFAULT NULL,
  p_address_snapshot   jsonb      DEFAULT NULL,
  p_promo_code         text       DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart           RECORD;
  v_item           RECORD;
  v_promo          RECORD;
  v_subtotal       numeric := 0;
  v_shipping_fee   numeric := 0;
  v_discount       numeric := 0;
  v_promo_id       uuid := NULL;
  v_total          numeric;
  v_order_id       uuid;
  v_price          numeric;
  v_item_count     integer := 0;
  v_code           text;
BEGIN
  SELECT * INTO v_cart
  FROM carts
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

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
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
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

  -- Resolve shipping fee from zone (first fee row by created_at ASC)
  SELECT COALESCE(sf.fee, 0)
  INTO v_shipping_fee
  FROM shipping_zones sz
  LEFT JOIN LATERAL (
    SELECT fee
    FROM shipping_fees
    WHERE zone_id = sz.id
    ORDER BY created_at ASC
    LIMIT 1
  ) sf ON true
  WHERE sz.id = p_shipping_zone_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid shipping zone';
  END IF;

  -- Optional promo: validate + compute discount server-side (never trust client money)
  v_code := NULLIF(upper(trim(COALESCE(p_promo_code, ''))), '');
  IF v_code IS NOT NULL THEN
    SELECT *
    INTO v_promo
    FROM promo_codes
    WHERE code = v_code
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid promo code';
    END IF;

    IF v_promo.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Promo code is inactive';
    END IF;

    IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at <= now() THEN
      RAISE EXCEPTION 'Promo code has expired';
    END IF;

    IF v_promo.max_uses IS NOT NULL AND v_promo.use_count >= v_promo.max_uses THEN
      RAISE EXCEPTION 'Promo code has reached its usage limit';
    END IF;

    IF v_promo.discount_type = 'percentage' THEN
      v_discount := round(v_subtotal * COALESCE(v_promo.discount_value, 0) / 100.0, 2);
    ELSE
      -- fixed
      v_discount := LEAST(COALESCE(v_promo.discount_value, 0), v_subtotal);
    END IF;

    IF v_discount < 0 THEN
      v_discount := 0;
    END IF;

    v_promo_id := v_promo.id;
  END IF;

  v_total := v_subtotal + v_shipping_fee - v_discount;
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  INSERT INTO orders (
    user_id, session_id, status,
    subtotal, shipping_fee, discount, total,
    payment_status,
    address_snapshot, phone, email,
    promo_code_id
  )
  VALUES (
    p_user_id, p_session_id, 'pending',
    v_subtotal, v_shipping_fee, v_discount, v_total,
    'pending',
    p_address_snapshot, p_phone, p_email,
    v_promo_id
  )
  RETURNING id INTO v_order_id;

  IF v_promo_id IS NOT NULL THEN
    UPDATE promo_codes
    SET use_count = use_count + 1
    WHERE id = v_promo_id;
  END IF;

  FOR v_item IN
    SELECT
      ci.customised_product_id,
      ci.quantity,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price AS base_price,
      p.name AS product_name
    FROM cart_items ci
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
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

  -- Dual source of truth: always create a pending payments row with order total
  INSERT INTO payments (
    order_id,
    status,
    amount,
    currency
  )
  VALUES (
    v_order_id,
    'pending',
    v_total,
    'USD'
  );

  DELETE FROM carts WHERE id = p_cart_id;

  RETURN v_order_id;
END;
$$;

-- Replace process_checkout (latest signature includes optional p_promo_code)
DROP FUNCTION IF EXISTS public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text);

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_cart_id            uuid,
  p_shipping_zone_id   uuid,
  p_user_id            uuid       DEFAULT NULL,
  p_session_id         text       DEFAULT NULL,
  p_phone              text       DEFAULT NULL,
  p_email              text       DEFAULT NULL,
  p_address_snapshot   jsonb      DEFAULT NULL,
  p_promo_code         text       DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart           RECORD;
  v_item           RECORD;
  v_promo          RECORD;
  v_subtotal       numeric := 0;
  v_shipping_fee   numeric := 0;
  v_zone_name      text := NULL;
  v_discount       numeric := 0;
  v_promo_id       uuid := NULL;
  v_total          numeric;
  v_order_id       uuid;
  v_price          numeric;
  v_item_count     integer := 0;
  v_code           text;
BEGIN
  SELECT * INTO v_cart
  FROM carts
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

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
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
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

  -- Resolve shipping fee + zone name from zone (first fee row by created_at ASC)
  SELECT COALESCE(sf.fee, 0), sz.name
  INTO v_shipping_fee, v_zone_name
  FROM shipping_zones sz
  LEFT JOIN LATERAL (
    SELECT fee
    FROM shipping_fees
    WHERE zone_id = sz.id
    ORDER BY created_at ASC
    LIMIT 1
  ) sf ON true
  WHERE sz.id = p_shipping_zone_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid shipping zone';
  END IF;

  -- Optional promo: validate + compute discount server-side (never trust client money)
  v_code := NULLIF(upper(trim(COALESCE(p_promo_code, ''))), '');
  IF v_code IS NOT NULL THEN
    SELECT *
    INTO v_promo
    FROM promo_codes
    WHERE code = v_code
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid promo code';
    END IF;

    IF v_promo.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Promo code is inactive';
    END IF;

    IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at <= now() THEN
      RAISE EXCEPTION 'Promo code has expired';
    END IF;

    IF v_promo.max_uses IS NOT NULL AND v_promo.use_count >= v_promo.max_uses THEN
      RAISE EXCEPTION 'Promo code has reached its usage limit';
    END IF;

    IF v_promo.discount_type = 'percentage' THEN
      v_discount := round(v_subtotal * COALESCE(v_promo.discount_value, 0) / 100.0, 2);
    ELSE
      -- fixed
      v_discount := LEAST(COALESCE(v_promo.discount_value, 0), v_subtotal);
    END IF;

    IF v_discount < 0 THEN
      v_discount := 0;
    END IF;

    v_promo_id := v_promo.id;
  END IF;

  v_total := v_subtotal + v_shipping_fee - v_discount;
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  INSERT INTO orders (
    user_id, session_id, status,
    subtotal, shipping_fee, discount, total,
    payment_status,
    address_snapshot, phone, email,
    promo_code_id,
    shipping_zone_id, shipping_zone_name
  )
  VALUES (
    p_user_id, p_session_id, 'pending',
    v_subtotal, v_shipping_fee, v_discount, v_total,
    'pending',
    p_address_snapshot, p_phone, p_email,
    v_promo_id,
    p_shipping_zone_id, v_zone_name
  )
  RETURNING id INTO v_order_id;

  IF v_promo_id IS NOT NULL THEN
    UPDATE promo_codes
    SET use_count = use_count + 1
    WHERE id = v_promo_id;
  END IF;

  FOR v_item IN
    SELECT
      ci.customised_product_id,
      ci.quantity,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price AS base_price,
      p.name AS product_name
    FROM cart_items ci
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
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

  -- Dual source of truth: always create a pending payments row with order total
  INSERT INTO payments (
    order_id,
    status,
    amount,
    currency
  )
  VALUES (
    v_order_id,
    'pending',
    v_total,
    'USD'
  );

  DELETE FROM carts WHERE id = p_cart_id;

  RETURN v_order_id;
END;
$$;

-- Recompute for a single product
CREATE OR REPLACE FUNCTION public.refresh_product_effective_prices(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products p
  SET
    min_effective_price = COALESCE(
      (
        SELECT MIN(COALESCE(cp.price_override, p.price))
        FROM public.customised_products cp
        WHERE cp.product_id = p.id
      ),
      p.price
    ),
    max_effective_price = COALESCE(
      (
        SELECT MAX(COALESCE(cp.price_override, p.price))
        FROM public.customised_products cp
        WHERE cp.product_id = p.id
      ),
      p.price
    )
  WHERE p.id = p_product_id;
END;
$$;

-- New products: seed from base price before insert
CREATE OR REPLACE FUNCTION public.products_set_effective_prices_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.min_effective_price := NEW.price;
  NEW.max_effective_price := NEW.price;
  RETURN NEW;
END;
$$;

-- Base price change: recompute from variants (does not touch price â†’ no recursion)
CREATE OR REPLACE FUNCTION public.products_refresh_effective_prices_on_price_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.price IS DISTINCT FROM OLD.price THEN
    PERFORM public.refresh_product_effective_prices(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Variant changes: keep product aggregates in sync
CREATE OR REPLACE FUNCTION public.customised_products_refresh_effective_prices()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_product_effective_prices(OLD.product_id);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_product_effective_prices(NEW.product_id);

  IF TG_OP = 'UPDATE'
    AND OLD.product_id IS DISTINCT FROM NEW.product_id THEN
    PERFORM public.refresh_product_effective_prices(OLD.product_id);
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- Source: 20260719150000_check_form_rate_limit.sql
-- ============================================================

-- Atomic form rate-limit check for contact/lead public actions.
-- Replaces non-atomic read â†’ decide â†’ write (TOCTOU) and enables fail-closed TS.

CREATE OR REPLACE FUNCTION public.check_form_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.form_rate_limits%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  IF p_key IS NULL OR length(trim(p_key)) = 0 THEN
    RAISE EXCEPTION 'p_key is required';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'p_limit must be >= 1';
  END IF;
  IF p_window_seconds IS NULL OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'p_window_seconds must be >= 1';
  END IF;

  -- Lock existing row if present
  SELECT * INTO v_row
  FROM public.form_rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    BEGIN
      INSERT INTO public.form_rate_limits (key, window_started_at, hit_count)
      VALUES (p_key, v_now, 1);
      RETURN true;
    EXCEPTION
      WHEN unique_violation THEN
        -- Concurrent first insert: lock winner and continue
        SELECT * INTO v_row
        FROM public.form_rate_limits
        WHERE key = p_key
        FOR UPDATE;
    END;
  END IF;

  IF v_now - v_row.window_started_at >= make_interval(secs => p_window_seconds) THEN
    UPDATE public.form_rate_limits
    SET window_started_at = v_now,
        hit_count = 1
    WHERE key = p_key;
    RETURN true;
  END IF;

  IF v_row.hit_count >= p_limit THEN
    RETURN false;
  END IF;

  UPDATE public.form_rate_limits
  SET hit_count = hit_count + 1
  WHERE key = p_key;

  RETURN true;
END;
$$;

-- ============================================================
-- Source: 20260720182000_restock_only_on_cancel.sql
-- ============================================================

-- Restock inventory only when an order is cancelled.
-- Payment failed/refunded alone must not restore stock while fulfillment continues.

CREATE OR REPLACE FUNCTION public.restock_order_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Already restored (idempotent)
  IF OLD.stock_restored THEN
    NEW.stock_restored := true;
    RETURN NEW;
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.customised_products cp
    SET quantity_stock = cp.quantity_stock + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.customised_product_id IS NOT NULL
      AND cp.id = oi.customised_product_id;

    NEW.stock_restored := true;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.restock_order_inventory() IS
  'Restores order line quantities to customised_products when status becomes cancelled. Idempotent via orders.stock_restored.';

-- ============================================================
-- Source: 20260720190000_get_admin_profiles_page.sql
-- ============================================================

-- Paginated admin profiles (avoids PostgREST max_rows silent truncation).

CREATE OR REPLACE FUNCTION public.get_admin_profiles_page(
  p_limit integer,
  p_offset integer,
  p_query text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  role profile_role,
  created_at timestamptz,
  is_active boolean,
  email text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer := GREATEST(1, LEAST(COALESCE(p_limit, 20), 100));
  v_offset integer := GREATEST(0, COALESCE(p_offset, 0));
  v_query text := NULLIF(TRIM(COALESCE(p_query, '')), '');
  v_role profile_role;
BEGIN
  IF public.get_user_role() != 'admin'::profile_role THEN
    RETURN;
  END IF;

  IF p_role IS NOT NULL AND TRIM(p_role) <> '' THEN
    BEGIN
      v_role := TRIM(p_role)::profile_role;
    EXCEPTION WHEN others THEN
      v_role := NULL;
    END;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.full_name,
    p.role,
    p.created_at,
    p.is_active,
    u.email::text,
    COUNT(*) OVER()::bigint AS total_count
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE
    (v_role IS NULL OR p.role = v_role)
    AND (p_is_active IS NULL OR p.is_active = p_is_active)
    AND (
      v_query IS NULL
      OR p.full_name ILIKE '%' || v_query || '%'
      OR u.email::text ILIKE '%' || v_query || '%'
    )
  ORDER BY p.created_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

-- ============================================================
-- Source: 20260720195000_admin_top_products_by_product_id.sql
-- ============================================================

-- Aggregate top products by real product UUID (via customised_products), not name snapshot.
-- Return type changes â†’ DROP first.

DROP FUNCTION IF EXISTS public.admin_top_products_by_revenue(integer, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.admin_top_products_by_revenue(
  p_limit integer DEFAULT 10,
  p_from timestamptz DEFAULT NULL,
  p_to_exclusive timestamptz DEFAULT NULL
)
RETURNS TABLE (
  product_id text,
  product_name text,
  revenue numeric,
  order_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    keyed.product_id,
    MAX(keyed.product_name) AS product_name,
    ROUND(
      SUM(COALESCE(keyed.price_snapshot, 0) * COALESCE(keyed.quantity, 0))::numeric,
      2
    ) AS revenue,
    COUNT(DISTINCT keyed.order_id)::bigint AS order_count
  FROM (
    SELECT
      oi.order_id,
      oi.price_snapshot,
      oi.quantity,
      COALESCE(
        cp.product_id::text,
        'orphan:' || COALESCE(NULLIF(TRIM(oi.product_name_snapshot), ''), 'unknown')
      ) AS product_id,
      COALESCE(
        NULLIF(TRIM(p.name), ''),
        NULLIF(TRIM(oi.product_name_snapshot), ''),
        'Unknown Product'
      ) AS product_name
    FROM public.order_items oi
    INNER JOIN public.orders o ON o.id = oi.order_id
    LEFT JOIN public.customised_products cp ON cp.id = oi.customised_product_id
    LEFT JOIN public.products p ON p.id = cp.product_id
    WHERE o.status <> 'cancelled'
      AND (p_from IS NULL OR o.created_at >= p_from)
      AND (p_to_exclusive IS NULL OR o.created_at < p_to_exclusive)
  ) keyed
  GROUP BY keyed.product_id
  ORDER BY revenue DESC
  LIMIT GREATEST(COALESCE(p_limit, 10), 1);
$$;

-- ============================================================
-- Source: 20260720200000_admin_orders_revenue_sum.sql
-- ============================================================

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

-- ============================================================
-- Source: 20260724120000_profiles_restrict_owner_updates.sql
-- ============================================================

-- Restrict owner self-updates on profiles to full_name only.
-- Extends prevent_role_change so owners cannot change role, is_active,
-- user_id, id, or created_at. Admins updating other users are unaffected.

CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.user_id = auth.uid() THEN
    IF OLD.role IS DISTINCT FROM NEW.role
       OR OLD.is_active IS DISTINCT FROM NEW.is_active
       OR OLD.user_id IS DISTINCT FROM NEW.user_id
       OR OLD.id IS DISTINCT FROM NEW.id
       OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
      RAISE EXCEPTION
        'Users can only update full_name on their own profile.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- Source: 20260724190000_set_default_user_address.sql
-- ============================================================

-- Atomic set-default for user_addresses.
-- Verifies ownership via auth.uid(), sets target default, then clears others.
-- Prevents clear-then-set leaving zero defaults when id is missing/foreign.

CREATE OR REPLACE FUNCTION public.set_default_user_address(p_address_id uuid)
RETURNS public.user_addresses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.user_addresses%ROWTYPE;
BEGIN
  IF p_address_id IS NULL THEN
    RAISE EXCEPTION 'Address id is required';
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.user_addresses
  SET is_default = true
  WHERE id = p_address_id
    AND user_id = auth.uid()
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Address not found';
  END IF;

  UPDATE public.user_addresses
  SET is_default = false
  WHERE user_id = auth.uid()
    AND id <> p_address_id
    AND is_default = true;

  RETURN v_row;
END;
$$;

