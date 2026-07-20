-- Restock inventory only when an order is cancelled.
-- Payment failed/refunded alone must not restore stock while fulfillment continues.

CREATE OR REPLACE FUNCTION public.restock_order_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Already restored (idempotent)
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

    NEW.stock_restored := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restock_order_inventory ON public.orders;

CREATE TRIGGER trg_restock_order_inventory
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restock_order_inventory();

COMMENT ON FUNCTION public.restock_order_inventory() IS
  'Restores order line quantities to customised_products when status becomes cancelled. Idempotent via orders.stock_restored.';
