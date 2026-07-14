-- Denormalized min/max effective prices for storefront list/filter/sort.
-- Effective unit price = COALESCE(customised_products.price_override, products.price).

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS min_effective_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS max_effective_price numeric(10, 2);

-- Backfill from variants (no variants → base price)
UPDATE public.products p
SET
  min_effective_price = sub.min_eff,
  max_effective_price = sub.max_eff
FROM (
  SELECT
    p2.id,
    COALESCE(
      MIN(COALESCE(cp.price_override, p2.price)),
      p2.price
    ) AS min_eff,
    COALESCE(
      MAX(COALESCE(cp.price_override, p2.price)),
      p2.price
    ) AS max_eff
  FROM public.products p2
  LEFT JOIN public.customised_products cp ON cp.product_id = p2.id
  GROUP BY p2.id, p2.price
) sub
WHERE p.id = sub.id;

ALTER TABLE public.products
  ALTER COLUMN min_effective_price SET NOT NULL,
  ALTER COLUMN max_effective_price SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_min_effective_price
  ON public.products (min_effective_price);

CREATE INDEX IF NOT EXISTS idx_products_max_effective_price
  ON public.products (max_effective_price);

COMMENT ON COLUMN public.products.min_effective_price IS
  'Min COALESCE(variant price_override, base price) across variants; equals price when no variants.';
COMMENT ON COLUMN public.products.max_effective_price IS
  'Max COALESCE(variant price_override, base price) across variants; equals price when no variants.';

-- Recompute for a single product
CREATE OR REPLACE FUNCTION public.refresh_product_effective_prices(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products p
  SET
    min_effective_price = COALESCE(
      (
        SELECT MIN(COALESCE(cp.price_override, p.price))
        FROM public.customised_products cp
        WHERE cp.product_id = p.id
      ),
      p.price
    ),
    max_effective_price = COALESCE(
      (
        SELECT MAX(COALESCE(cp.price_override, p.price))
        FROM public.customised_products cp
        WHERE cp.product_id = p.id
      ),
      p.price
    )
  WHERE p.id = p_product_id;
END;
$$;

-- New products: seed from base price before insert
CREATE OR REPLACE FUNCTION public.products_set_effective_prices_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.min_effective_price := NEW.price;
  NEW.max_effective_price := NEW.price;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_set_effective_prices_on_insert ON public.products;
CREATE TRIGGER trg_products_set_effective_prices_on_insert
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.products_set_effective_prices_on_insert();

-- Base price change: recompute from variants (does not touch price → no recursion)
CREATE OR REPLACE FUNCTION public.products_refresh_effective_prices_on_price_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.price IS DISTINCT FROM OLD.price THEN
    PERFORM public.refresh_product_effective_prices(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_refresh_effective_prices_on_price_update ON public.products;
CREATE TRIGGER trg_products_refresh_effective_prices_on_price_update
  AFTER UPDATE OF price ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.products_refresh_effective_prices_on_price_update();

-- Variant changes: keep product aggregates in sync
CREATE OR REPLACE FUNCTION public.customised_products_refresh_effective_prices()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_product_effective_prices(OLD.product_id);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_product_effective_prices(NEW.product_id);

  IF TG_OP = 'UPDATE'
    AND OLD.product_id IS DISTINCT FROM NEW.product_id THEN
    PERFORM public.refresh_product_effective_prices(OLD.product_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customised_products_refresh_effective_prices ON public.customised_products;
CREATE TRIGGER trg_customised_products_refresh_effective_prices
  AFTER INSERT OR UPDATE OR DELETE ON public.customised_products
  FOR EACH ROW
  EXECUTE FUNCTION public.customised_products_refresh_effective_prices();
