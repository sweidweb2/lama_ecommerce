--------------------------------------------------
-- Checkout Function – Atomic Order Creation
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
  WHERE id = p_cart_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found or already deleted';
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
      ON cp.id = ci.customised_product_id AND cp.deleted_at IS NULL
    JOIN products p
      ON p.id = cp.product_id AND p.deleted_at IS NULL
    WHERE ci.cart_id = p_cart_id
      AND ci.deleted_at IS NULL
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

--------------------------------------------------
-- GRANT EXECUTE PERMISSION
--------------------------------------------------
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) TO service_role;

--------------------------------------------------
-- RELOAD SUPABASE SCHEMA CACHE
--------------------------------------------------
NOTIFY pgrst, 'reload schema';
