--------------------------------------------------
-- Forward migration: remove soft deletes
-- For DBs that already applied older migrations with deleted_at.
-- Fresh installs (db reset) get the cleaned baseline and skip
-- column drops that no longer exist (IF EXISTS).
--------------------------------------------------

-- 1. Profiles: is_active from deleted_at
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_active boolean not null default true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'deleted_at'
  ) THEN
    UPDATE profiles SET is_active = (deleted_at IS NULL);
  END IF;
END $$;

-- 2. Purge soft-deleted rows (order matters for FKs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cart_items' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM cart_items WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'carts' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM carts WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlists' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM wishlists WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM reviews WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_addresses' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM user_addresses WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM order_items WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM payments WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shipments' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM shipments WHERE deleted_at IS NOT NULL;
  END IF;

  -- Orders with soft-delete: remove payments/shipments first then orders
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE deleted_at IS NOT NULL);
    DELETE FROM shipments WHERE order_id IN (SELECT id FROM orders WHERE deleted_at IS NOT NULL);
    DELETE FROM orders WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customised_products' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM wishlists WHERE customised_product_id IN (
      SELECT id FROM customised_products WHERE deleted_at IS NOT NULL
    );
    DELETE FROM cart_items WHERE customised_product_id IN (
      SELECT id FROM customised_products WHERE deleted_at IS NOT NULL
    );
    DELETE FROM customised_products WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM product_questions WHERE product_id IN (SELECT id FROM products WHERE deleted_at IS NOT NULL);
    DELETE FROM product_views WHERE product_id IN (SELECT id FROM products WHERE deleted_at IS NOT NULL);
    DELETE FROM product_stats WHERE product_id IN (SELECT id FROM products WHERE deleted_at IS NOT NULL);
    DELETE FROM products WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'deleted_at'
  ) THEN
    UPDATE products SET category_id = NULL WHERE category_id IN (
      SELECT id FROM categories WHERE deleted_at IS NOT NULL
    );
    UPDATE categories SET parent_id = NULL WHERE parent_id IN (
      SELECT id FROM categories WHERE deleted_at IS NOT NULL
    );
    DELETE FROM categories WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'brands' AND column_name = 'deleted_at'
  ) THEN
    UPDATE products SET brand_id = NULL WHERE brand_id IN (
      SELECT id FROM brands WHERE deleted_at IS NOT NULL
    );
    DELETE FROM brands WHERE deleted_at IS NOT NULL;
  END IF;
END $$;

-- 3. Cart items unique index (full, not partial)
DROP INDEX IF EXISTS cart_items_unique_active;
DROP INDEX IF EXISTS cart_items_unique_cart_variant;
CREATE UNIQUE INDEX cart_items_unique_cart_variant
ON cart_items (cart_id, customised_product_id);

-- 4. Drop policies that still reference deleted_at (must happen BEFORE DROP COLUMN)
DROP POLICY IF EXISTS "Public can read categories" ON categories;
DROP POLICY IF EXISTS "Public can read product variants" ON customised_products;
DROP POLICY IF EXISTS "Users can read reviews" ON reviews;

DROP POLICY IF EXISTS "Users can read own carts" ON carts;
DROP POLICY IF EXISTS "Users can insert own carts" ON carts;
DROP POLICY IF EXISTS "Users can update own carts" ON carts;
DROP POLICY IF EXISTS "Users can delete own carts" ON carts;

DROP POLICY IF EXISTS "Users can read own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;

DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
DROP POLICY IF EXISTS "Users can update own order items" ON order_items;
DROP POLICY IF EXISTS "Users can delete own order items" ON order_items;

DROP POLICY IF EXISTS "Users and guests can read wishlist items" ON wishlists;
DROP POLICY IF EXISTS "Users and guests can insert wishlist items" ON wishlists;
DROP POLICY IF EXISTS "Users and guests can delete wishlist items" ON wishlists;
DROP POLICY IF EXISTS "Users can view own wishlist items" ON wishlists;
DROP POLICY IF EXISTS "Users can insert own wishlist items" ON wishlists;
DROP POLICY IF EXISTS "Users can delete own wishlist items" ON wishlists;
DROP POLICY IF EXISTS "Users can read own wishlist items" ON wishlists;

DROP POLICY IF EXISTS "Users can read own payments" ON payments;
DROP POLICY IF EXISTS "Users can read own shipments" ON shipments;

-- 5. Drop deleted_at columns (CASCADE covers any remaining dependents)
ALTER TABLE IF EXISTS profiles DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE IF EXISTS user_addresses DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE IF EXISTS brands DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE IF EXISTS categories DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE IF EXISTS products DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE IF EXISTS customised_products DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE IF EXISTS wishlists DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE IF EXISTS carts DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE IF EXISTS cart_items DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE IF EXISTS reviews DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE IF EXISTS orders DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE IF EXISTS order_items DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE IF EXISTS payments DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE IF EXISTS shipments DROP COLUMN IF EXISTS deleted_at CASCADE;

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

GRANT EXECUTE ON FUNCTION public.get_admin_profiles() TO authenticated;

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

GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO service_role;
REVOKE ALL ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) FROM anon;

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

-- 8. Recreate RLS policies without deleted_at
CREATE POLICY "Public can read categories"
ON categories FOR SELECT
USING (true);

CREATE POLICY "Public can read product variants"
ON customised_products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = customised_products.product_id
      AND products.is_active = true
  )
);

CREATE POLICY "Users can read reviews"
ON reviews FOR SELECT
USING (
  review_status = 'approved'
  OR auth.uid() = user_id
);

CREATE POLICY "Users can read own carts"
ON carts FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own carts"
ON carts FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own carts"
ON carts FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own carts"
ON carts FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Users can read own cart items"
ON cart_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM carts c
    WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own cart items"
ON cart_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM carts c
    WHERE c.id = cart_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own cart items"
ON cart_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM carts c
    WHERE c.id = cart_id AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM carts c
    WHERE c.id = cart_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own cart items"
ON cart_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM carts c
    WHERE c.id = cart_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own orders"
ON orders FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own orders"
ON orders FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own orders"
ON orders FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Users can read own order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own order items"
ON order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own order items"
ON order_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own order items"
ON order_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own wishlist items"
ON wishlists FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wishlist items"
ON wishlists FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own wishlist items"
ON wishlists FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Users can read own payments"
ON payments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = payments.order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own shipments"
ON shipments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = shipments.order_id AND o.user_id = auth.uid()
  )
);

NOTIFY pgrst, 'reload schema';
