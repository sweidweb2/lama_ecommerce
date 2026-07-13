-- Restock inventory when an order is cancelled or payment fails/refunds.
-- process_checkout decrements stock at place-order (payment still pending);
-- without this, cancelled/failed/refunded orders permanently lose stock.
--
-- Idempotent via orders.stock_restored so cancel + refund does not double-restock.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_restored boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.orders.stock_restored IS
  'True after order line quantities have been returned to customised_products.quantity_stock';

CREATE OR REPLACE FUNCTION public.restock_order_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  should_restock boolean := false;
BEGIN
  -- Already restored (e.g. cancelled then later marked refunded)
  IF OLD.stock_restored THEN
    NEW.stock_restored := true;
    RETURN NEW;
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    should_restock := true;
  END IF;

  IF NEW.payment_status IN ('failed', 'refunded')
     AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    should_restock := true;
  END IF;

  IF should_restock THEN
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
  BEFORE UPDATE OF status, payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restock_order_inventory();
