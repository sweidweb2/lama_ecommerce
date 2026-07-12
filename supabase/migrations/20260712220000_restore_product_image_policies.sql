--------------------------------------------------
-- Ensure product image storage + table policies
-- after soft-delete CASCADE may have dropped
-- policies that referenced products.deleted_at.
--------------------------------------------------

-- Public storefront product read (if CASCADE dropped it)
DROP POLICY IF EXISTS "Public can read active products" ON products;
CREATE POLICY "Public can read active products"
ON products FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Public can read product images" ON product_images;
CREATE POLICY "Public can read product images"
ON product_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_images.product_id
      AND products.is_active = true
  )
);

-- Admin table CRUD (idempotent)
DROP POLICY IF EXISTS "Admins can manage product_images" ON product_images;
CREATE POLICY "Admins can manage product_images"
ON product_images FOR ALL
USING (public.get_user_role() = 'admin'::profile_role)
WITH CHECK (public.get_user_role() = 'admin'::profile_role);

-- Storage: admin upload / delete / update; public read
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
  AND public.get_user_role() = 'admin'::profile_role
);

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
  AND public.get_user_role() = 'admin'::profile_role
);

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
  AND public.get_user_role() = 'admin'::profile_role
);

DROP POLICY IF EXISTS "Public can read product storage" ON storage.objects;
CREATE POLICY "Public can read product storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

NOTIFY pgrst, 'reload schema';
