--------------------------------------------------
-- Orders: Add session_id column and index
--
-- Goal:
-- - Associate guest orders with a session_id (same as carts)
-- - Enable efficient lookups by session_id
--------------------------------------------------

-- 1) Add session_id column to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS session_id text;

-- 2) Create index on session_id for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_session_id
ON orders (session_id);

