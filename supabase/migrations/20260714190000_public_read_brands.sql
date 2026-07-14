-- Allow anon / authenticated guests to read brands (product embed brand:brands(*)).
-- Admin CRUD remains via "Admins can manage brands".

DROP POLICY IF EXISTS "Public can read brands" ON brands;
CREATE POLICY "Public can read brands"
ON brands
FOR SELECT
USING (true);
