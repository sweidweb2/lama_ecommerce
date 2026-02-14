--------------------------------------------------
-- Products, Product Images, and Product Variants Public Read Policies
--
-- Goal: Allow anyone (including unauthenticated users) to read
--       active products, product images, and product variants for the public storefront.
--
-- These policies work alongside the admin policies:
-- - Admins can do all operations (SELECT, INSERT, UPDATE, DELETE)
-- - Public can only SELECT active products and related data
--------------------------------------------------

-- Products: Public can read active products
drop policy if exists "Public can read active products" on products;
create policy "Public can read active products"
on products
for select
using (is_active = true);

-- Product Images: Public can read images for active products
drop policy if exists "Public can read product images" on product_images;
create policy "Public can read product images"
on product_images
for select
using (
  exists (
    select 1 from products
    where products.id = product_images.product_id
    and products.is_active = true
  )
);

-- Product Variants (Customised Products): Public can read variants for active products
drop policy if exists "Public can read product variants" on customised_products;
create policy "Public can read product variants"
on customised_products
for select
using (
  deleted_at is null
  and exists (
    select 1 from products
    where products.id = customised_products.product_id
    and products.is_active = true
  )
);
