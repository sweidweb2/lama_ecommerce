-- Prevent hard-delete of sold variants: order_items keep a live FK for restock-on-cancel.
-- Display continues to use denormalized snapshots; customised_product_id stays nullable.

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_customised_product_id_fkey
  FOREIGN KEY (customised_product_id)
  REFERENCES public.customised_products(id)
  ON DELETE RESTRICT;
