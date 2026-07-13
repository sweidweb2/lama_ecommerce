-- Checkout: pending payments row + promo codes at place-order.
-- Extends process_checkout (zone-resolved shipping) with optional p_promo_code,
-- inserts payments(status=pending), stores orders.promo_code_id, bumps use_count.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS promo_code_id uuid
  REFERENCES public.promo_codes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_promo_code_id ON public.orders(promo_code_id);

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

REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) FROM anon;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) TO service_role;
