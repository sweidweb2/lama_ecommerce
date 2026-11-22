-- Data integrity: atomic multi-step writes + promo release on cancel
-- Fixes dual-write / partial-failure paths outside process_checkout.

-- ============================================================
-- 1. Unique payment per order (dedupe keep latest)
-- ============================================================

DELETE FROM public.payments p
USING public.payments newer
WHERE p.order_id = newer.order_id
  AND p.id <> newer.id
  AND (
    newer.created_at > p.created_at
    OR (newer.created_at = p.created_at AND newer.id > p.id)
  );

CREATE UNIQUE INDEX IF NOT EXISTS payments_order_id_uidx
  ON public.payments (order_id);

-- ============================================================
-- 2. Restock on cancel + release promo use_count
-- ============================================================

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

    -- Release promo slot consumed at checkout
    IF NEW.promo_code_id IS NOT NULL THEN
      UPDATE public.promo_codes
      SET use_count = GREATEST(use_count - 1, 0)
      WHERE id = NEW.promo_code_id;
    END IF;

    NEW.stock_restored := true;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.restock_order_inventory() IS
  'Restores order line stock and releases promo use_count when status becomes cancelled. Idempotent via orders.stock_restored.';

-- ============================================================
-- 3. Atomic payment upsert + order.payment_status sync
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_payment_for_order(
  p_order_id uuid,
  p_status payment_status,
  p_amount numeric DEFAULT NULL,
  p_currency text DEFAULT 'USD',
  p_transaction_id text DEFAULT NULL,
  p_paid_at timestamptz DEFAULT NULL,
  p_gateway text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_payment_url text DEFAULT NULL
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments;
  v_paid_at timestamptz;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'p_order_id is required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  v_paid_at := COALESCE(
    p_paid_at,
    CASE WHEN p_status = 'paid' THEN now() ELSE NULL END
  );

  INSERT INTO public.payments (
    order_id, status, amount, currency, transaction_id,
    paid_at, gateway, payment_method, payment_url
  )
  VALUES (
    p_order_id, p_status, p_amount,
    COALESCE(NULLIF(trim(p_currency), ''), 'USD'),
    NULLIF(trim(p_transaction_id), ''),
    v_paid_at,
    NULLIF(trim(p_gateway), ''),
    NULLIF(trim(p_payment_method), ''),
    NULLIF(trim(p_payment_url), '')
  )
  ON CONFLICT (order_id) DO UPDATE
  SET
    status = EXCLUDED.status,
    amount = COALESCE(EXCLUDED.amount, payments.amount),
    currency = EXCLUDED.currency,
    transaction_id = COALESCE(EXCLUDED.transaction_id, payments.transaction_id),
    paid_at = EXCLUDED.paid_at,
    gateway = COALESCE(EXCLUDED.gateway, payments.gateway),
    payment_method = COALESCE(EXCLUDED.payment_method, payments.payment_method),
    payment_url = COALESCE(EXCLUDED.payment_url, payments.payment_url)
  RETURNING * INTO v_payment;

  UPDATE public.orders
  SET payment_status = p_status
  WHERE id = p_order_id;

  RETURN v_payment;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_payment_for_order(
  uuid, payment_status, numeric, text, text, timestamptz, text, text, text
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_payment_for_order(
  uuid, payment_status, numeric, text, text, timestamptz, text, text, text
) FROM anon;
REVOKE ALL ON FUNCTION public.upsert_payment_for_order(
  uuid, payment_status, numeric, text, text, timestamptz, text, text, text
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_payment_for_order(
  uuid, payment_status, numeric, text, text, timestamptz, text, text, text
) TO service_role;

-- ============================================================
-- 4. Atomic admin order update (+ payment sync + ship)
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_update_order(
  p_order_id uuid,
  p_patch jsonb DEFAULT '{}'::jsonb,
  p_carrier_name text DEFAULT NULL,
  p_tracking_number text DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
  v_shipment_count integer;
  v_payment_status payment_status;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'p_order_id is required';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  UPDATE public.orders
  SET
    user_id = CASE
      WHEN p_patch ? 'user_id' THEN NULLIF(p_patch->>'user_id', '')::uuid
      ELSE user_id
    END,
    status = CASE
      WHEN p_patch ? 'status' THEN (p_patch->>'status')::order_status
      ELSE status
    END,
    payment_status = CASE
      WHEN p_patch ? 'payment_status' THEN (p_patch->>'payment_status')::payment_status
      ELSE payment_status
    END,
    subtotal = CASE
      WHEN p_patch ? 'subtotal' THEN (p_patch->>'subtotal')::numeric
      ELSE subtotal
    END,
    shipping_fee = CASE
      WHEN p_patch ? 'shipping_fee' THEN (p_patch->>'shipping_fee')::numeric
      ELSE shipping_fee
    END,
    discount = CASE
      WHEN p_patch ? 'discount' THEN (p_patch->>'discount')::numeric
      ELSE discount
    END,
    total = CASE
      WHEN p_patch ? 'total' THEN (p_patch->>'total')::numeric
      ELSE total
    END,
    phone = CASE
      WHEN p_patch ? 'phone' THEN NULLIF(trim(p_patch->>'phone'), '')
      ELSE phone
    END,
    email = CASE
      WHEN p_patch ? 'email' THEN NULLIF(trim(p_patch->>'email'), '')
      ELSE email
    END
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  -- If marking shipped and no shipment yet, create one in the same transaction
  IF p_patch ? 'status' AND (p_patch->>'status')::order_status = 'shipped' THEN
    SELECT count(*)::integer INTO v_shipment_count
    FROM public.shipments
    WHERE order_id = p_order_id;

    IF v_shipment_count = 0 THEN
      IF NULLIF(trim(p_carrier_name), '') IS NULL
         OR NULLIF(trim(p_tracking_number), '') IS NULL THEN
        RAISE EXCEPTION 'Carrier and tracking number are required to mark as shipped';
      END IF;

      INSERT INTO public.shipments (order_id, carrier_name, tracking_number)
      VALUES (
        p_order_id,
        trim(p_carrier_name),
        trim(p_tracking_number)
      );
    END IF;
  END IF;

  -- Sync payments row when payment_status is patched
  IF p_patch ? 'payment_status' THEN
    v_payment_status := (p_patch->>'payment_status')::payment_status;
    PERFORM public.upsert_payment_for_order(
      p_order_id,
      v_payment_status,
      v_order.total,
      'USD',
      NULL,
      CASE WHEN v_payment_status = 'paid' THEN now() ELSE NULL END,
      NULL,
      NULL,
      NULL
    );
    -- Re-read order (payment upsert also touches payment_status)
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  END IF;

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_order(uuid, jsonb, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_order(uuid, jsonb, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_update_order(uuid, jsonb, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_order(uuid, jsonb, text, text) TO service_role;

-- ============================================================
-- 5. Atomic guest cart → user merge
-- ============================================================

-- Returns { moved_count: int, errors: text[] }
-- Stock issues skip/clamp a line (partial success); DB failures raise and roll back.
CREATE OR REPLACE FUNCTION public.merge_guest_cart_to_user(
  p_user_id uuid,
  p_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest_cart public.carts;
  v_user_cart public.carts;
  v_src record;
  v_dest_id uuid;
  v_dest_qty_existing integer;
  v_stock integer;
  v_dest_qty integer;
  v_has_dest boolean;
  v_moved integer := 0;
  v_errors text[] := ARRAY[]::text[];
  v_label text;
BEGIN
  IF p_user_id IS NULL OR NULLIF(trim(p_session_id), '') IS NULL THEN
    RAISE EXCEPTION 'p_user_id and p_session_id are required';
  END IF;

  SELECT * INTO v_guest_cart
  FROM public.carts
  WHERE session_id = trim(p_session_id)
    AND user_id IS NULL
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'moved_count', 0,
      'merged', false,
      'errors', '[]'::jsonb
    );
  END IF;

  SELECT * INTO v_user_cart
  FROM public.carts
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.carts (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_user_cart;
  END IF;

  IF v_guest_cart.id = v_user_cart.id THEN
    RETURN jsonb_build_object(
      'moved_count', 0,
      'merged', false,
      'errors', '[]'::jsonb
    );
  END IF;

  FOR v_src IN
    SELECT id, customised_product_id, quantity
    FROM public.cart_items
    WHERE cart_id = v_guest_cart.id
    FOR UPDATE
  LOOP
    v_label := 'Item ' || v_src.customised_product_id::text;

    SELECT quantity_stock INTO v_stock
    FROM public.customised_products
    WHERE id = v_src.customised_product_id;

    IF v_stock IS NULL THEN
      v_errors := array_append(v_errors, v_label || ': Product variant not found (skipped)');
      CONTINUE;
    END IF;

    SELECT ci.id, ci.quantity
    INTO v_dest_id, v_dest_qty_existing
    FROM public.cart_items ci
    WHERE ci.cart_id = v_user_cart.id
      AND ci.customised_product_id = v_src.customised_product_id
    FOR UPDATE;

    v_has_dest := FOUND;

    IF v_has_dest THEN
      v_dest_qty := v_dest_qty_existing + v_src.quantity;
    ELSE
      v_dest_qty := v_src.quantity;
    END IF;

    IF v_stock <= 0 THEN
      v_errors := array_append(
        v_errors,
        v_label || ': This product variant is out of stock (skipped)'
      );
      CONTINUE;
    END IF;

    IF v_dest_qty > v_stock THEN
      IF v_has_dest AND v_dest_qty_existing >= v_stock THEN
        DELETE FROM public.cart_items WHERE id = v_src.id;
        v_errors := array_append(
          v_errors,
          v_label || format(
            ': Insufficient stock. Available: %s, Requested: %s (kept existing quantity %s)',
            v_stock, v_dest_qty, v_dest_qty_existing
          )
        );
        CONTINUE;
      END IF;

      v_dest_qty := v_stock;
      v_errors := array_append(
        v_errors,
        v_label || format(
          ': Insufficient stock. Available: %s, Requested: %s (quantity reduced to %s)',
          v_stock,
          CASE WHEN v_has_dest THEN v_dest_qty_existing + v_src.quantity ELSE v_src.quantity END,
          v_stock
        )
      );
    END IF;

    IF v_has_dest THEN
      UPDATE public.cart_items
      SET quantity = v_dest_qty
      WHERE id = v_dest_id;

      DELETE FROM public.cart_items WHERE id = v_src.id;
    ELSE
      UPDATE public.cart_items
      SET cart_id = v_user_cart.id, quantity = v_dest_qty
      WHERE id = v_src.id;
    END IF;

    v_moved := v_moved + 1;
  END LOOP;

  -- Drop leftover guest lines (skipped OOS) with the guest cart
  DELETE FROM public.carts WHERE id = v_guest_cart.id;

  RETURN jsonb_build_object(
    'moved_count', v_moved,
    'merged', true,
    'errors', to_jsonb(v_errors)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.merge_guest_cart_to_user(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.merge_guest_cart_to_user(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.merge_guest_cart_to_user(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.merge_guest_cart_to_user(uuid, text) TO service_role;

-- ============================================================
-- 6. Atomic wishlist claim by session
-- ============================================================

CREATE OR REPLACE FUNCTION public.claim_wishlist_by_session(
  p_session_id text,
  p_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_claimed integer := 0;
  v_exists boolean;
BEGIN
  IF p_user_id IS NULL OR NULLIF(trim(p_session_id), '') IS NULL THEN
    RAISE EXCEPTION 'p_session_id and p_user_id are required';
  END IF;

  FOR v_row IN
    SELECT id, customised_product_id
    FROM public.wishlists
    WHERE session_id = trim(p_session_id)
      AND user_id IS NULL
    FOR UPDATE
  LOOP
    SELECT EXISTS (
      SELECT 1
      FROM public.wishlists
      WHERE user_id = p_user_id
        AND customised_product_id = v_row.customised_product_id
    ) INTO v_exists;

    IF v_exists THEN
      DELETE FROM public.wishlists WHERE id = v_row.id;
    ELSE
      UPDATE public.wishlists
      SET user_id = p_user_id, session_id = NULL
      WHERE id = v_row.id;
      v_claimed := v_claimed + 1;
    END IF;
  END LOOP;

  RETURN v_claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_wishlist_by_session(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_wishlist_by_session(text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.claim_wishlist_by_session(text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_wishlist_by_session(text, uuid) TO service_role;

-- ============================================================
-- 7. Atomic set primary product image
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_primary_product_image(
  p_product_id uuid,
  p_image_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_product_id IS NULL OR p_image_id IS NULL THEN
    RAISE EXCEPTION 'p_product_id and p_image_id are required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE id = p_image_id AND product_id = p_product_id
  ) THEN
    RAISE EXCEPTION 'Product image not found';
  END IF;

  UPDATE public.product_images
  SET is_primary = (id = p_image_id)
  WHERE product_id = p_product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_primary_product_image(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_primary_product_image(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.set_primary_product_image(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_primary_product_image(uuid, uuid) TO service_role;

-- ============================================================
-- 8. Atomic shipping zone + fee create/update
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_shipping_zone_with_fee(
  p_name text,
  p_estimated_time text DEFAULT NULL,
  p_fee numeric DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  estimated_time text,
  created_at timestamptz,
  fee numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_zone public.shipping_zones;
BEGIN
  IF NULLIF(trim(p_name), '') IS NULL THEN
    RAISE EXCEPTION 'Zone name is required';
  END IF;

  INSERT INTO public.shipping_zones (name, estimated_time)
  VALUES (trim(p_name), NULLIF(trim(p_estimated_time), ''))
  RETURNING * INTO v_zone;

  INSERT INTO public.shipping_fees (zone_id, fee)
  VALUES (v_zone.id, p_fee);

  RETURN QUERY
  SELECT v_zone.id, v_zone.name, v_zone.estimated_time, v_zone.created_at, p_fee;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_shipping_zone_with_fee(
  p_id uuid,
  p_name text,
  p_estimated_time text DEFAULT NULL,
  p_fee numeric DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  estimated_time text,
  created_at timestamptz,
  fee numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_zone public.shipping_zones;
  v_fee_id uuid;
BEGIN
  IF p_id IS NULL OR NULLIF(trim(p_name), '') IS NULL THEN
    RAISE EXCEPTION 'Zone id and name are required';
  END IF;

  UPDATE public.shipping_zones
  SET
    name = trim(p_name),
    estimated_time = NULLIF(trim(p_estimated_time), '')
  WHERE shipping_zones.id = p_id
  RETURNING * INTO v_zone;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shipping zone not found';
  END IF;

  SELECT sf.id INTO v_fee_id
  FROM public.shipping_fees sf
  WHERE sf.zone_id = p_id
  ORDER BY sf.created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_fee_id IS NOT NULL THEN
    UPDATE public.shipping_fees
    SET fee = p_fee
    WHERE shipping_fees.id = v_fee_id;
  ELSE
    INSERT INTO public.shipping_fees (zone_id, fee)
    VALUES (p_id, p_fee);
  END IF;

  RETURN QUERY
  SELECT v_zone.id, v_zone.name, v_zone.estimated_time, v_zone.created_at, p_fee;
END;
$$;

REVOKE ALL ON FUNCTION public.create_shipping_zone_with_fee(text, text, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_shipping_zone_with_fee(text, text, numeric) FROM anon;
REVOKE ALL ON FUNCTION public.create_shipping_zone_with_fee(text, text, numeric) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_shipping_zone_with_fee(text, text, numeric) TO service_role;

REVOKE ALL ON FUNCTION public.update_shipping_zone_with_fee(uuid, text, text, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_shipping_zone_with_fee(uuid, text, text, numeric) FROM anon;
REVOKE ALL ON FUNCTION public.update_shipping_zone_with_fee(uuid, text, text, numeric) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.update_shipping_zone_with_fee(uuid, text, text, numeric) TO service_role;

NOTIFY pgrst, 'reload schema';
