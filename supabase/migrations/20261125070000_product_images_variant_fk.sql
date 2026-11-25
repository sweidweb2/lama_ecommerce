-- Link product gallery images to an optional variant (customised_products).
-- Images remain owned by the product; variant delete unassigns (SET NULL).

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS customised_product_id uuid
    REFERENCES public.customised_products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_product_images_product_variant
  ON public.product_images(product_id, customised_product_id);

-- Ensure assigned variant belongs to the same product as the image row.
CREATE OR REPLACE FUNCTION public.product_images_enforce_variant_product_match()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_product_id uuid;
BEGIN
  IF NEW.customised_product_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT product_id INTO v_product_id
  FROM public.customised_products
  WHERE id = NEW.customised_product_id;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'customised_product_id % does not exist', NEW.customised_product_id;
  END IF;

  IF v_product_id <> NEW.product_id THEN
    RAISE EXCEPTION
      'customised_product_id % belongs to product %, not image product %',
      NEW.customised_product_id,
      v_product_id,
      NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_images_enforce_variant_product_match
  ON public.product_images;

CREATE TRIGGER trg_product_images_enforce_variant_product_match
  BEFORE INSERT OR UPDATE OF product_id, customised_product_id
  ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.product_images_enforce_variant_product_match();
