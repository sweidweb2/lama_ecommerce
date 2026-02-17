--------------------------------------------------
-- Cart Items UPSERT Function (Double-Click Safe)
--
-- Goal:
-- - Atomic UPSERT operation for cart items
-- - Stock validation within transaction
-- - Prevents duplicate items in same cart
-- - Handles race conditions from double-clicks
--
-- Depends on:
-- - cart_items table
-- - customised_products table (for stock validation)
--------------------------------------------------

--------------------------------------------------
-- PARTIAL UNIQUE INDEX
-- Prevents duplicate active cart items (ignores soft-deleted)
-- This index ensures only one active cart item per (cart_id, customised_product_id)
--------------------------------------------------
DROP INDEX IF EXISTS cart_items_unique_active;
CREATE UNIQUE INDEX cart_items_unique_active
ON cart_items (cart_id, customised_product_id)
WHERE deleted_at IS NULL;

--------------------------------------------------
-- UPSERT CART ITEM FUNCTION
-- Atomically adds or updates cart item with stock validation
-- Must be in public schema for Supabase RPC to find it
--------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_cart_item(
  p_cart_id uuid,
  p_customised_product_id uuid,
  p_quantity integer
)
RETURNS SETOF cart_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_stock integer;
  v_existing_quantity integer;
  v_new_quantity integer;
  v_result RECORD;
BEGIN
  -- 1. Validate stock availability
  SELECT quantity_stock INTO v_available_stock
  FROM customised_products
  WHERE id = p_customised_product_id
    AND deleted_at IS NULL;
  
  IF v_available_stock IS NULL THEN
    RAISE EXCEPTION 'Product variant not found or deleted';
  END IF;
  
  IF v_available_stock <= 0 THEN
    RAISE EXCEPTION 'Product variant is out of stock';
  END IF;
  
  -- 2. Try to update existing cart item (if exists and not soft-deleted)
  UPDATE cart_items
  SET quantity = quantity + p_quantity
  WHERE cart_id = p_cart_id
    AND customised_product_id = p_customised_product_id
    AND deleted_at IS NULL
  RETURNING * INTO v_result;
  
  -- 3. If no row was updated, insert new cart item
  IF NOT FOUND THEN
    -- Validate quantity doesn't exceed stock before inserting
    IF p_quantity > v_available_stock THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', 
        v_available_stock, p_quantity;
    END IF;
    
    INSERT INTO cart_items (cart_id, customised_product_id, quantity)
    VALUES (p_cart_id, p_customised_product_id, p_quantity)
    RETURNING * INTO v_result;
  ELSE
    -- Row was updated, validate final quantity doesn't exceed stock
    IF v_result.quantity > v_available_stock THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', 
        v_available_stock, v_result.quantity;
    END IF;
  END IF;
  
  -- 6. Return the result from the table (avoids ambiguous column references)
  RETURN QUERY
  SELECT *
  FROM cart_items
  WHERE id = v_result.id;
END;
$$;

--------------------------------------------------
-- GRANT EXECUTE PERMISSION
-- Allow authenticated users and service role to execute
--------------------------------------------------
GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO service_role;

--------------------------------------------------
-- RELOAD SUPABASE SCHEMA CACHE
-- Notify PostgREST to reload schema cache so RPC function is visible
--------------------------------------------------
NOTIFY pgrst, 'reload schema';
