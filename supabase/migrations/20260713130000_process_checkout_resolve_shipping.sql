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

REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb) TO service_role;
