-- Unique variant attributes per product (color + size + material).
-- Dedupes keep the newest row; dependent FKs are remapped before delete.

---------------------------------------------------
-- 1. Temp map: older duplicate → newest keeper
---------------------------------------------------

CREATE TEMP TABLE _variant_dedupe_map ON COMMIT DROP AS
WITH ranked AS (
  SELECT
    id,
    product_id,
    coalesce(color, '') AS color_key,
    coalesce(size, '') AS size_key,
    coalesce(material, '') AS material_key,
    ROW_NUMBER() OVER (
      PARTITION BY
        product_id,
        coalesce(color, ''),
        coalesce(size, ''),
        coalesce(material, '')
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM customised_products
),
keepers AS (
  SELECT id, product_id, color_key, size_key, material_key
  FROM ranked
  WHERE rn = 1
)
SELECT
  r.id AS loser_id,
  k.id AS keeper_id
FROM ranked r
JOIN keepers k
  ON k.product_id = r.product_id
 AND k.color_key = r.color_key
 AND k.size_key = r.size_key
 AND k.material_key = r.material_key
WHERE r.rn > 1;

---------------------------------------------------
-- 2. Drop wishlist/cart rows that would uniquely collide after remap
---------------------------------------------------

DELETE FROM wishlists w
USING _variant_dedupe_map m
WHERE w.customised_product_id = m.loser_id
  AND EXISTS (
    SELECT 1
    FROM wishlists k
    WHERE k.customised_product_id = m.keeper_id
      AND (
        (w.user_id IS NOT NULL AND k.user_id = w.user_id)
        OR (
          w.user_id IS NULL
          AND w.session_id IS NOT NULL
          AND k.user_id IS NULL
          AND k.session_id = w.session_id
        )
      )
  );

DELETE FROM cart_items ci
USING _variant_dedupe_map m
WHERE ci.customised_product_id = m.loser_id
  AND EXISTS (
    SELECT 1
    FROM cart_items k
    WHERE k.customised_product_id = m.keeper_id
      AND k.cart_id = ci.cart_id
  );

---------------------------------------------------
-- 3. Remap remaining FKs, then delete losers
---------------------------------------------------

UPDATE wishlists w
SET customised_product_id = m.keeper_id
FROM _variant_dedupe_map m
WHERE w.customised_product_id = m.loser_id;

UPDATE cart_items ci
SET customised_product_id = m.keeper_id
FROM _variant_dedupe_map m
WHERE ci.customised_product_id = m.loser_id;

UPDATE order_items oi
SET customised_product_id = m.keeper_id
FROM _variant_dedupe_map m
WHERE oi.customised_product_id = m.loser_id;

DELETE FROM customised_products cp
USING _variant_dedupe_map m
WHERE cp.id = m.loser_id;

---------------------------------------------------
-- 4. Unique index (COALESCE so null attrs still collide)
---------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS customised_products_product_attrs_uidx
  ON customised_products (
    product_id,
    coalesce(color, ''),
    coalesce(size, ''),
    coalesce(material, '')
  );
