-- Business-rule hardening:
-- 1) Customers cannot write orders / order_items (SELECT only)
-- 2) cart_items / order_items quantity >= 1
-- 3) Drop direct cart_items INSERT (ATC goes through upsert_cart_item)
-- 4) Harden upsert_cart_item (qty, ownership, active product)
-- 5) get_user_role respects is_active
-- 6) process_checkout: lock cart, reject inactive products / bad qty
-- 7) Restock trigger restores promo use_count on cancel
-- 8) Revenue RPCs exclude returned + unpaid
-- 9) Unique active cart per user_id
-- 10) Explicit revoke admin RPCs from anon/authenticated

-- ---------------------------------------------------------------------------
-- Quantity constraints
-- ---------------------------------------------------------------------------

UPDATE public.cart_items SET quantity = 1 WHERE quantity < 1;
UPDATE public.order_items SET quantity = 1 WHERE quantity < 1;

ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_quantity_check;
ALTER TABLE public.cart_items
  ADD CONSTRAINT cart_items_quantity_check CHECK (quantity >= 1);

ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_quantity_check;
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_quantity_check CHECK (quantity >= 1);

-- ---------------------------------------------------------------------------
-- RLS: customers read-only on orders / order_items
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON public.orders;

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can update own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can delete own order items" ON public.order_items;

-- ATC uses SECURITY DEFINER upsert_cart_item; block direct client inserts.
DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;

-- ---------------------------------------------------------------------------
-- get_user_role: inactive admins are treated as user
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS profile_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role profile_role;
  user_active boolean;
BEGIN
  SELECT role, is_active INTO user_role, user_active
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF user_role IS NULL THEN
    RETURN 'user'::profile_role;
  END IF;

  IF user_active IS NOT TRUE THEN
    RETURN 'user'::profile_role;
  END IF;

  RETURN user_role;
END;
$$;

-- ---------------------------------------------------------------------------
-- upsert_cart_item: ownership + qty floor + active product
-- ---------------------------------------------------------------------------

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
  v_product_active boolean;
  v_cart_user_id uuid;
  v_result RECORD;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Quantity must be at least 1';
  END IF;

  SELECT c.user_id INTO v_cart_user_id
  FROM public.carts c
  WHERE c.id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  -- Authenticated callers may only mutate their own cart.
  -- Service-role / guest paths call with auth.uid() NULL.
  IF auth.uid() IS NOT NULL THEN
    IF v_cart_user_id IS NULL OR v_cart_user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Cart does not belong to this user';
    END IF;
  END IF;

  SELECT cp.quantity_stock, p.is_active
  INTO v_available_stock, v_product_active
  FROM public.customised_products cp
  JOIN public.products p ON p.id = cp.product_id
  WHERE cp.id = p_customised_product_id;

  IF v_available_stock IS NULL THEN
    RAISE EXCEPTION 'Product variant not found';
  END IF;

  IF v_product_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Product is not active';
  END IF;

  IF v_available_stock <= 0 THEN
    RAISE EXCEPTION 'Product variant is out of stock';
  END IF;

  UPDATE public.cart_items
  SET quantity = quantity + p_quantity
  WHERE cart_id = p_cart_id
    AND customised_product_id = p_customised_product_id
  RETURNING * INTO v_result;

  IF NOT FOUND THEN
    IF p_quantity > v_available_stock THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %',
        v_available_stock, p_quantity;
    END IF;

    INSERT INTO public.cart_items (cart_id, customised_product_id, quantity)
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
  FROM public.cart_items
  WHERE id = v_result.id;
END;
$$;

-- ---------------------------------------------------------------------------
-- process_checkout: lock cart, reject inactive products / qty < 1
-- ---------------------------------------------------------------------------

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
  v_deleted        integer := 0;
BEGIN
  SELECT * INTO v_cart
  FROM public.carts
  WHERE id = p_cart_id
  FOR UPDATE;

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
      p.name           AS product_name,
      p.is_active      AS product_active
    FROM public.cart_items ci
    JOIN public.customised_products cp ON cp.id = ci.customised_product_id
    JOIN public.products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
    FOR UPDATE OF ci, cp
  LOOP
    v_item_count := v_item_count + 1;

    IF v_item.quantity IS NULL OR v_item.quantity < 1 THEN
      RAISE EXCEPTION 'Invalid quantity for "%"', v_item.product_name;
    END IF;

    IF v_item.product_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Product "%" is no longer available', v_item.product_name;
    END IF;

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

  SELECT COALESCE(sf.fee, 0), sz.name
  INTO v_shipping_fee, v_zone_name
  FROM public.shipping_zones sz
  LEFT JOIN LATERAL (
    SELECT fee
    FROM public.shipping_fees
    WHERE zone_id = sz.id
    ORDER BY created_at ASC
    LIMIT 1
  ) sf ON true
  WHERE sz.id = p_shipping_zone_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid shipping zone';
  END IF;

  v_code := NULLIF(upper(trim(COALESCE(p_promo_code, ''))), '');
  IF v_code IS NOT NULL THEN
    SELECT *
    INTO v_promo
    FROM public.promo_codes
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

  INSERT INTO public.orders (
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
    UPDATE public.promo_codes
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
    FROM public.cart_items ci
    JOIN public.customised_products cp ON cp.id = ci.customised_product_id
    JOIN public.products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
  LOOP
    v_price := COALESCE(v_item.price_override, v_item.base_price);

    INSERT INTO public.order_items (
      order_id, customised_product_id, quantity,
      price_snapshot, product_name_snapshot,
      size_snapshot, material_snapshot, color_snapshot
    )
    VALUES (
      v_order_id, v_item.customised_product_id, v_item.quantity,
      v_price, v_item.product_name,
      v_item.size, v_item.material, v_item.color
    );

    UPDATE public.customised_products
    SET quantity_stock = quantity_stock - v_item.quantity
    WHERE id = v_item.customised_product_id
      AND quantity_stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock race condition for "%": stock changed since validation',
        v_item.product_name;
    END IF;
  END LOOP;

  INSERT INTO public.payments (
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

  DELETE FROM public.carts WHERE id = p_cart_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted = 0 THEN
    RAISE EXCEPTION 'Cart already consumed by another checkout';
  END IF;

  RETURN v_order_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Restock on cancel: also release promo use_count (floor at 0)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.restock_order_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  'Restores stock (and promo use_count) when order status becomes cancelled. Idempotent via orders.stock_restored.';

-- ---------------------------------------------------------------------------
-- Unique cart per authenticated user
-- ---------------------------------------------------------------------------

-- Keep newest cart per user; move orphan items onto the keeper when possible.
WITH ranked AS (
  SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) AS rn
  FROM public.carts
  WHERE user_id IS NOT NULL
),
keepers AS (
  SELECT id AS keeper_id, user_id
  FROM ranked
  WHERE rn = 1
),
orphans AS (
  SELECT r.id AS orphan_id, k.keeper_id
  FROM ranked r
  JOIN keepers k ON k.user_id = r.user_id
  WHERE r.rn > 1
)
UPDATE public.cart_items AS orphan_item
SET cart_id = o.keeper_id
FROM orphans o
WHERE orphan_item.cart_id = o.orphan_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.cart_items keeper_item
    WHERE keeper_item.cart_id = o.keeper_id
      AND keeper_item.customised_product_id = orphan_item.customised_product_id
  );

WITH ranked AS (
  SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) AS rn
  FROM public.carts
  WHERE user_id IS NOT NULL
)
DELETE FROM public.carts c
USING ranked r
WHERE c.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS carts_unique_user
  ON public.carts (user_id)
  WHERE user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Revenue: paid only; exclude cancelled + returned
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_orders_revenue_sum(
  p_from timestamptz DEFAULT NULL,
  p_to_exclusive timestamptz DEFAULT NULL
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(round(sum(o.total)::numeric, 2), 0)
  FROM public.orders o
  WHERE o.payment_status = 'paid'
    AND o.status NOT IN ('cancelled', 'returned')
    AND (p_from IS NULL OR o.created_at >= p_from)
    AND (p_to_exclusive IS NULL OR o.created_at < p_to_exclusive);
$$;

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
    WHERE o.payment_status = 'paid'
      AND o.status NOT IN ('cancelled', 'returned')
      AND (p_from IS NULL OR o.created_at >= p_from)
      AND (p_to_exclusive IS NULL OR o.created_at < p_to_exclusive)
  ) keyed
  GROUP BY keyed.product_id
  ORDER BY revenue DESC
  LIMIT GREATEST(COALESCE(p_limit, 10), 1);
$$;

CREATE OR REPLACE FUNCTION public.admin_orders_by_month(
  p_from timestamptz,
  p_to_exclusive timestamptz
)
RETURNS TABLE (month text, orders bigint, sales numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      date_trunc('month', p_from AT TIME ZONE 'UTC') AS start_month,
      date_trunc(
        'month',
        (p_to_exclusive - interval '1 microsecond') AT TIME ZONE 'UTC'
      ) AS end_month
  ),
  months AS (
    SELECT generate_series(
      (SELECT start_month FROM bounds),
      (SELECT end_month FROM bounds),
      interval '1 month'
    ) AS month_start
  )
  SELECT
    to_char(m.month_start, 'YYYY-MM') AS month,
    count(o.id) FILTER (
      WHERE o.payment_status = 'paid'
        AND o.status NOT IN ('cancelled', 'returned')
    )::bigint AS orders,
    coalesce(
      round(
        sum(o.total) FILTER (
          WHERE o.payment_status = 'paid'
            AND o.status NOT IN ('cancelled', 'returned')
        )::numeric,
        2
      ),
      0
    ) AS sales
  FROM months m
  LEFT JOIN public.orders o
    ON o.created_at >= (m.month_start AT TIME ZONE 'UTC')
   AND o.created_at < ((m.month_start + interval '1 month') AT TIME ZONE 'UTC')
  GROUP BY m.month_start
  ORDER BY m.month_start;
$$;

-- ---------------------------------------------------------------------------
-- Explicit RPC grants (defense vs default anon/authenticated execute)
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.admin_orders_revenue_sum(timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_orders_revenue_sum(timestamptz, timestamptz) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_orders_revenue_sum(timestamptz, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.admin_top_products_by_revenue(integer, timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_top_products_by_revenue(integer, timestamptz, timestamptz) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_top_products_by_revenue(integer, timestamptz, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.admin_orders_by_month(timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_orders_by_month(timestamptz, timestamptz) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_orders_by_month(timestamptz, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO service_role;

NOTIFY pgrst, 'reload schema';
