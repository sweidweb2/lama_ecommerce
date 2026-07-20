-- Allow hard-deleting orders that have payments and/or shipments.
-- order_items already CASCADE; payments and shipments previously blocked delete (NO ACTION).

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_order_id_fkey;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_order_id_fkey
  FOREIGN KEY (order_id)
  REFERENCES public.orders(id)
  ON DELETE CASCADE;

ALTER TABLE public.shipments
  DROP CONSTRAINT IF EXISTS shipments_order_id_fkey;

ALTER TABLE public.shipments
  ADD CONSTRAINT shipments_order_id_fkey
  FOREIGN KEY (order_id)
  REFERENCES public.orders(id)
  ON DELETE CASCADE;
