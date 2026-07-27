-- Triggers

-- Split from consolidated schema migration. Fresh DB reset only.



-- ----- triggers -----

-- Apply updated_at trigger to tables that have updated_at column
create trigger update_carts_updated_at before update on carts
  for each row execute function update_updated_at_column();

create trigger update_products_updated_at before update on products
  for each row execute function update_updated_at_column();

create trigger update_orders_updated_at before update on orders
  for each row execute function update_updated_at_column();

-- Create trigger
create trigger prevent_user_role_change
before update on profiles
for each row
execute function public.prevent_role_change();

DROP TRIGGER IF EXISTS trg_restock_order_inventory ON public.orders;

CREATE TRIGGER trg_restock_order_inventory
  BEFORE UPDATE OF status, payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restock_order_inventory();

DROP TRIGGER IF EXISTS trg_products_set_effective_prices_on_insert ON public.products;

CREATE TRIGGER trg_products_set_effective_prices_on_insert
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.products_set_effective_prices_on_insert();

DROP TRIGGER IF EXISTS trg_products_refresh_effective_prices_on_price_update ON public.products;

CREATE TRIGGER trg_products_refresh_effective_prices_on_price_update
  AFTER UPDATE OF price ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.products_refresh_effective_prices_on_price_update();

DROP TRIGGER IF EXISTS trg_customised_products_refresh_effective_prices ON public.customised_products;

CREATE TRIGGER trg_customised_products_refresh_effective_prices
  AFTER INSERT OR UPDATE OR DELETE ON public.customised_products
  FOR EACH ROW
  EXECUTE FUNCTION public.customised_products_refresh_effective_prices();

DROP TRIGGER IF EXISTS trg_restock_order_inventory ON public.orders;

CREATE TRIGGER trg_restock_order_inventory
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restock_order_inventory();

