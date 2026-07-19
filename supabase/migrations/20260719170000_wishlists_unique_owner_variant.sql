-- Unique wishlist ownership per variant (auth user and guest session).
-- Dedupes keep the newest row so claim + concurrent toggles cannot double-insert.

---------------------------------------------------
-- 1. Dedupe user wishlist rows (keep newest per user + variant)
---------------------------------------------------

DELETE FROM wishlists AS w
USING wishlists AS newer
WHERE w.user_id IS NOT NULL
  AND newer.user_id IS NOT NULL
  AND w.user_id = newer.user_id
  AND w.customised_product_id = newer.customised_product_id
  AND (
    newer.created_at > w.created_at
    OR (newer.created_at = w.created_at AND newer.id > w.id)
  );

---------------------------------------------------
-- 2. Dedupe guest wishlist rows (keep newest per session + variant)
---------------------------------------------------

DELETE FROM wishlists AS w
USING wishlists AS newer
WHERE w.user_id IS NULL
  AND w.session_id IS NOT NULL
  AND newer.user_id IS NULL
  AND newer.session_id IS NOT NULL
  AND w.session_id = newer.session_id
  AND w.customised_product_id = newer.customised_product_id
  AND (
    newer.created_at > w.created_at
    OR (newer.created_at = w.created_at AND newer.id > w.id)
  );

---------------------------------------------------
-- 3. Unique indexes
---------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_variant_uidx
  ON wishlists (user_id, customised_product_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS wishlists_session_variant_uidx
  ON wishlists (session_id, customised_product_id)
  WHERE user_id IS NULL AND session_id IS NOT NULL;
