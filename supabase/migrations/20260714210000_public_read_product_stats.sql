-- Allow anon / authenticated guests to read product_stats aggregates (PDP views / ATC / purchases).
-- Writes remain admin / service-role only via "Admins can manage product stats".

DROP POLICY IF EXISTS "Public can read product stats" ON product_stats;
CREATE POLICY "Public can read product stats"
ON product_stats
FOR SELECT
USING (true);
