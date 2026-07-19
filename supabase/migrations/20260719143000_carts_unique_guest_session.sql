-- Enforce one open guest cart per session_id.
-- Carts have no status column; checkout hard-deletes the cart row.
-- Concurrent guest ATC previously could insert multiple carts for the same
-- session; lookups used created_at DESC LIMIT 1 and orphaned older rows.

---------------------------------------------------
-- 1. Dedupe orphan guest carts (keep newest per session_id)
---------------------------------------------------

-- Identify keeper cart (newest) per guest session with duplicates
CREATE TEMP TABLE _guest_cart_keepers AS
SELECT DISTINCT ON (session_id)
  id AS keeper_id,
  session_id
FROM carts
WHERE user_id IS NULL
  AND session_id IS NOT NULL
ORDER BY session_id, created_at DESC, id DESC;

-- Older carts for the same session (to merge then delete)
CREATE TEMP TABLE _guest_cart_orphans AS
SELECT c.id AS orphan_id, k.keeper_id
FROM carts c
JOIN _guest_cart_keepers k ON k.session_id = c.session_id
WHERE c.user_id IS NULL
  AND c.session_id IS NOT NULL
  AND c.id <> k.keeper_id;

-- When orphan and keeper share the same variant: sum qty onto keeper, drop orphan row
UPDATE cart_items AS keeper
SET quantity = keeper.quantity + orphan.quantity
FROM cart_items AS orphan
JOIN _guest_cart_orphans o ON o.orphan_id = orphan.cart_id
WHERE keeper.cart_id = o.keeper_id
  AND keeper.customised_product_id = orphan.customised_product_id;

DELETE FROM cart_items AS orphan
USING _guest_cart_orphans o, cart_items AS keeper
WHERE orphan.cart_id = o.orphan_id
  AND keeper.cart_id = o.keeper_id
  AND keeper.customised_product_id = orphan.customised_product_id;

-- Move remaining orphan items onto the keeper cart
UPDATE cart_items AS orphan
SET cart_id = o.keeper_id
FROM _guest_cart_orphans o
WHERE orphan.cart_id = o.orphan_id;

-- Delete orphan cart rows (any leftover items cascade-delete)
DELETE FROM carts c
USING _guest_cart_orphans o
WHERE c.id = o.orphan_id;

DROP TABLE _guest_cart_orphans;
DROP TABLE _guest_cart_keepers;

---------------------------------------------------
-- 2. Partial unique index: one guest cart per session
---------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS carts_unique_guest_session
ON carts (session_id)
WHERE user_id IS NULL AND session_id IS NOT NULL;
