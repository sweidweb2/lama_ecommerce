-- Types, tables, column alters, indexes, comments

-- Split from consolidated schema migration. Fresh DB reset only.



-- ----- types -----

-- Consolidated schema migration (all prior schema migrations merged).
-- Jobs / cron remain in a separate migration.
-- Generated for a fresh DB reset — do not apply on top of an already-migrated DB.


-- ============================================================
-- Source: 20260126141860_initial.sql
-- ============================================================


-- ============================================================
-- Source: 20260126141860_initial.sql
-- ============================================================

-- Consolidated schema migration
-- Merged from 30 migration files
-- Generated: 2026-07-12


-- =============================================================================
-- Source: 20260126141860_initial.sql
-- =============================================================================

--------------------------------------------------
-- ENUM TYPES (PostgreSQL requires named types)
--------------------------------------------------
-- Note: Using gen_random_uuid() (built-in, no extension needed)
--------------------------------------------------

-- Profile roles
create type profile_role as enum ('user', 'admin');

-- Order & shipment status
create type order_status as enum ('pending', 'processing', 'packed', 'shipped', 'delivered', 'returned', 'cancelled');

-- Payment status
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

-- Review moderation status
create type review_status as enum ('pending', 'approved', 'rejected');

-- Contact us ticket status
create type contact_status as enum ('new', 'read', 'replied', 'resolved');

-- Promo discount type
create type discount_type as enum ('percentage', 'fixed');

-- ----- tables -----

--------------------------------------------------
-- PROFILE
--------------------------------------------------
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id),
  full_name text,
  role profile_role not null default 'user',
  created_at timestamptz default now(),
  is_active boolean not null default true
);

--------------------------------------------------
-- USER ADDRESS
--------------------------------------------------
create table user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  country text,
  city text,
  address text,
  postal_code text,
  phone text,
  is_default boolean default false,
  created_at timestamptz default now()
);

--------------------------------------------------
-- BRAND
--------------------------------------------------
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_image_url text,
  created_at timestamptz default now()
);

--------------------------------------------------
-- CATEGORIES
--------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  parent_id uuid references categories(id),
  is_active boolean default true,
  created_at timestamptz default now()
);

--------------------------------------------------
-- PRODUCTS
--------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  slug text unique,
  brand_id uuid references brands(id),
  category_id uuid references categories(id),
  sku text unique,
  price numeric(10,2) not null,
  is_featured boolean default false,
  is_trending boolean default false,
  is_active boolean default true,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

--------------------------------------------------
-- PRODUCT IMAGES
--------------------------------------------------
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url_image text not null,
  is_primary boolean default false,
  created_at timestamptz default now()
);

--------------------------------------------------
-- PRODUCT VARIANTS (CUSTOMISED PRODUCT)
--------------------------------------------------
create table customised_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  color text,
  size text,
  material text,
  quantity_stock integer default 0 check (quantity_stock >= 0),
  sku_variant text unique,
  price_override numeric(10,2),
  created_at timestamptz default now()
);

--------------------------------------------------
-- WISHLIST
--------------------------------------------------
create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customised_product_id uuid not null references customised_products(id),
  created_at timestamptz default now()
);

--------------------------------------------------
-- CART
--------------------------------------------------
create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (user_id is not null or session_id is not null)
);

--------------------------------------------------
-- CART ITEMS
--------------------------------------------------
create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  customised_product_id uuid not null references customised_products(id),
  quantity integer not null,
  created_at timestamptz default now()
);

--------------------------------------------------
-- REVIEWS
--------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  rating integer check (rating between 1 and 5),
  title text,
  comment text,
  review_status review_status default 'pending',
  created_at timestamptz default now(),
  unique (product_id, user_id)
);

--------------------------------------------------
-- PRODUCT QUESTIONS & ANSWERS
--------------------------------------------------
create table product_questions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  user_id uuid references auth.users(id) on delete set null,
  question text not null,
  is_approved boolean default false,
  created_at timestamptz default now()
);

create table product_answers (
  id uuid primary key default gen_random_uuid(),
  product_question_id uuid not null references product_questions(id) on delete cascade,
  admin_id uuid references auth.users(id) on delete set null,
  answer text not null,
  created_at timestamptz default now()
);

-- ORDERS
--------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  status order_status not null,
  subtotal numeric(10,2),
  shipping_fee numeric(10,2),
  discount numeric(10,2),
  total numeric(10,2),
  payment_status payment_status not null,
  address_snapshot jsonb,
  phone text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

--------------------------------------------------
-- ORDER ITEMS (SNAPSHOTS)
--------------------------------------------------
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  customised_product_id uuid,
  quantity integer not null,
  price_snapshot numeric(10,2),
  product_name_snapshot text,
  size_snapshot text,
  material_snapshot text,
  color_snapshot text,
  created_at timestamptz default now()
);

--------------------------------------------------
-- PAYMENTS
--------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  status payment_status not null,
  transaction_id text,
  paid_at timestamptz,
  amount numeric(10,2),
  currency text,
  gateway text,
  payment_method text,
  payment_url text,
  callback_payload jsonb,
  created_at timestamptz default now()
);

--------------------------------------------------
-- SHIPPING
--------------------------------------------------
create table shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  estimated_time text,
  created_at timestamptz default now()
);

create table shipping_fees (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references shipping_zones(id) on delete cascade,
  fee numeric(10,2),
  created_at timestamptz default now()
);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  carrier_name text,
  tracking_number text,
  created_at timestamptz default now()
);

--------------------------------------------------
-- ANALYTICS
--------------------------------------------------
create table product_views (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  user_id uuid,
  viewed_at timestamptz default now()
);

create table product_stats (
  product_id uuid primary key references products(id),
  views_count integer default 0,
  add_to_cart_count integer default 0,
  purchase_count integer default 0
);

--------------------------------------------------
-- LEADS & CONTACT
--------------------------------------------------
create table leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz default now()
);

create table contact_us (
  id uuid primary key default gen_random_uuid(),
  subject text,
  message text,
  full_name text,
  phone text,
  email text,
  status contact_status default 'new',
  created_at timestamptz default now()
);

--------------------------------------------------
-- PROMO CODES
--------------------------------------------------
create table promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type discount_type not null,
  discount_value numeric(10,2),
  expires_at timestamptz,
  max_uses integer,
  use_count integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- =============================================================================
-- Source: 20260220100000_backups_table.sql
-- =============================================================================

--------------------------------------------------
-- Backups (metadata for admin backup/restore points)
--------------------------------------------------

create table backups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('full', 'incremental')),
  size text,
  storage_path text,
  created_at timestamptz default now()
);

-- Rate-limit counters (service-role only; RLS on, no policies)
create table if not exists public.form_rate_limits (
  key text primary key,
  window_started_at timestamptz not null default now(),
  hit_count int not null default 0
);

-- ----- alters -----

-- =============================================================================
-- Source: 20260220120003_orders_session_id.sql
-- =============================================================================

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

-- =============================================================================
-- Source: 20260220120006_wishlist_session_id_and_rls.sql
-- =============================================================================

--------------------------------------------------
-- Wishlist: Add session_id and Update RLS Policies
--
-- Goal: 
-- - Add session_id column to wishlists table for guest users
-- - Add constraint ensuring either user_id or session_id is not null
-- - Update RLS policies to allow:
--   - Admins: full access (SELECT, INSERT, DELETE)
--   - Users: manage their own wishlist items (user_id = auth.uid())
--   - Guests: manage wishlist items where user_id is null (session_id handled in app code)
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
-- - auth.uid() for user identification
--------------------------------------------------

--------------------------------------------------
-- ALTER WISHLIST TABLE: Add session_id column
--------------------------------------------------

-- Add session_id column
alter table wishlists
add column session_id text;

-- Add constraint: either user_id or session_id must be not null
alter table wishlists
add constraint wishlists_user_or_session_check
check (user_id is not null or session_id is not null);

-- =============================================================================
-- Source: 20260221120000_product_views_session_id.sql
-- =============================================================================

--------------------------------------------------
-- Product Views: Add session_id for guest tracking
--------------------------------------------------

-- Add session_id column
alter table product_views
add column session_id text;

-- Add constraint: either user_id or session_id must be not null
alter table product_views
add constraint product_views_user_or_session_check
check (user_id is not null or session_id is not null);

-- ============================================================
-- Source: 20260712210000_remove_soft_deletes.sql
-- ============================================================

--------------------------------------------------
-- Forward migration: remove soft deletes
-- For DBs that already applied older migrations with deleted_at.
-- Fresh installs (db reset) get the cleaned baseline and skip
-- column drops that no longer exist (IF EXISTS).
--------------------------------------------------

-- 1. Profiles: is_active from deleted_at
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_active boolean not null default true;

-- 5. Drop deleted_at columns (CASCADE covers any remaining dependents)
ALTER TABLE IF EXISTS profiles DROP COLUMN IF EXISTS deleted_at CASCADE;

ALTER TABLE IF EXISTS user_addresses DROP COLUMN IF EXISTS deleted_at CASCADE;

ALTER TABLE IF EXISTS brands DROP COLUMN IF EXISTS deleted_at CASCADE;

ALTER TABLE IF EXISTS categories DROP COLUMN IF EXISTS deleted_at CASCADE;

ALTER TABLE IF EXISTS products DROP COLUMN IF EXISTS deleted_at CASCADE;

ALTER TABLE IF EXISTS customised_products DROP COLUMN IF EXISTS deleted_at CASCADE;

ALTER TABLE IF EXISTS wishlists DROP COLUMN IF EXISTS deleted_at CASCADE;

ALTER TABLE IF EXISTS carts DROP COLUMN IF EXISTS deleted_at CASCADE;

ALTER TABLE IF EXISTS cart_items DROP COLUMN IF EXISTS deleted_at CASCADE;

ALTER TABLE IF EXISTS reviews DROP COLUMN IF EXISTS deleted_at CASCADE;

ALTER TABLE IF EXISTS orders DROP COLUMN IF EXISTS deleted_at CASCADE;

ALTER TABLE IF EXISTS order_items DROP COLUMN IF EXISTS deleted_at CASCADE;

ALTER TABLE IF EXISTS payments DROP COLUMN IF EXISTS deleted_at CASCADE;

ALTER TABLE IF EXISTS shipments DROP COLUMN IF EXISTS deleted_at CASCADE;

-- ============================================================
-- Source: 20260713120000_restock_on_order_cancel.sql
-- ============================================================

-- Restock inventory when an order is cancelled or payment fails/refunds.
-- process_checkout decrements stock at place-order (payment still pending);
-- without this, cancelled/failed/refunded orders permanently lose stock.
--
-- Idempotent via orders.stock_restored so cancel + refund does not double-restock.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_restored boolean NOT NULL DEFAULT false;

-- ============================================================
-- Source: 20260713140000_checkout_payments_and_promos.sql
-- ============================================================

-- Checkout: pending payments row + promo codes at place-order.
-- Extends process_checkout (zone-resolved shipping) with optional p_promo_code,
-- inserts payments(status=pending), stores orders.promo_code_id, bumps use_count.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS promo_code_id uuid
  REFERENCES public.promo_codes(id) ON DELETE SET NULL;

-- ============================================================
-- Source: 20260713150000_orders_shipping_zone_persist.sql
-- ============================================================

-- Persist shipping zone id + name snapshot on orders at checkout.
-- Fee was already resolved in SQL from p_shipping_zone_id; columns were missing.
-- Shipment rows are created later at fulfillment (admin marks shipped).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_zone_id uuid
    REFERENCES public.shipping_zones(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_zone_name text;

-- ============================================================
-- Source: 20260713160000_order_items_variant_fk.sql
-- ============================================================

-- Prevent hard-delete of sold variants: order_items keep a live FK for restock-on-cancel.
-- Display continues to use denormalized snapshots; customised_product_id stays nullable.

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_customised_product_id_fkey
  FOREIGN KEY (customised_product_id)
  REFERENCES public.customised_products(id)
  ON DELETE RESTRICT;

ALTER TABLE products
  ALTER COLUMN slug SET NOT NULL;

-- ============================================================
-- Source: 20260714200000_product_effective_prices.sql
-- ============================================================

-- Denormalized min/max effective prices for storefront list/filter/sort.
-- Effective unit price = COALESCE(customised_products.price_override, products.price).

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS min_effective_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS max_effective_price numeric(10, 2);

ALTER TABLE public.products
  ALTER COLUMN min_effective_price SET NOT NULL,
  ALTER COLUMN max_effective_price SET NOT NULL;

-- ============================================================
-- Source: 20260719152000_leads_user_id.sql
-- ============================================================

-- Link newsletter leads to auth users when subscribed while logged in.
-- Nullable: guests remain user_id null; ON DELETE SET NULL if account removed.

alter table public.leads
  add column if not exists user_id uuid references auth.users (id) on delete set null;

-- ============================================================
-- Source: 20260719160000_leads_status_unsubscribe.sql
-- ============================================================

-- Lead consent / unsubscribe fields for marketing list hygiene.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid;

ALTER TABLE public.leads
  ALTER COLUMN status SET DEFAULT 'subscribed',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN source SET DEFAULT 'footer',
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN unsubscribe_token SET DEFAULT gen_random_uuid(),
  ALTER COLUMN unsubscribe_token SET NOT NULL;

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('subscribed', 'unsubscribed'));

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_source_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_source_check
  CHECK (source IN ('footer', 'admin', 'unknown'));

ALTER TABLE categories
  ALTER COLUMN slug SET NOT NULL;

-- ============================================================
-- Source: 20260720183000_orders_cascade_payments_shipments.sql
-- ============================================================

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

-- ----- indexes -----

-- --------------------------------------------------

-- Profile Indexes
create index idx_profiles_user_id on profiles(user_id);

create index idx_profiles_role on profiles(role);

-- User Address Indexes
create index idx_user_addresses_user_id on user_addresses(user_id);

create index idx_user_addresses_is_default on user_addresses(user_id, is_default);

-- Categories Indexes
create index idx_categories_parent_id on categories(parent_id);

create index idx_categories_is_active on categories(is_active);

-- Products Indexes
create index idx_products_category_id on products(category_id);

create index idx_products_brand_id on products(brand_id);

create index idx_products_is_active on products(is_active);

create index idx_products_is_featured on products(is_featured);

create index idx_products_is_trending on products(is_trending);

create index idx_products_price on products(price);

create index idx_products_category_active_price on products(category_id, is_active, price);

-- Product Images Indexes
create index idx_product_images_product_id on product_images(product_id);

create index idx_product_images_primary on product_images(product_id, is_primary);

-- Customised Products Indexes
create index idx_variants_product_id on customised_products(product_id);

create index idx_variants_stock on customised_products(quantity_stock);

create index idx_variants_attributes on customised_products(color, size, material);

-- Wishlist Indexes
create index idx_wishlist_user_id on wishlists(user_id);

create index idx_wishlist_variant_id on wishlists(customised_product_id);

-- Carts Indexes
create index idx_carts_user_id on carts(user_id);

create index idx_carts_session_id on carts(session_id);

-- Cart Items Indexes
create index idx_cart_items_cart_id on cart_items(cart_id);

create index idx_cart_items_variant_id on cart_items(customised_product_id);

-- Reviews Indexes
create index idx_reviews_product_id on reviews(product_id);

create index idx_reviews_review_status on reviews(review_status);

-- product questions & answers Indexes
create index idx_questions_product_id on product_questions(product_id);

create index idx_questions_is_approved on product_questions(is_approved);

-- Orders Indexes
create index idx_orders_user_id on orders(user_id);

create index idx_orders_status on orders(status);

create index idx_orders_created_at on orders(created_at desc);

-- Order Items Indexes
create index idx_order_items_order_id on order_items(order_id);

-- Payments Indexes
create index idx_payments_order_id on payments(order_id);

create index idx_payments_status on payments(status);

create index idx_payments_transaction on payments(transaction_id);

-- Shipments Indexes
create index idx_shipments_order_id on shipments(order_id);

create index idx_shipments_tracking on shipments(tracking_number) where tracking_number is not null;

-- Product Stats Indexes
create index idx_product_views_product_id on product_views(product_id);

create index idx_product_views_user_id on product_views(user_id);

create index idx_product_views_viewed_at on product_views(viewed_at desc);

-- Promo Codes Indexes
create index idx_promo_codes_active on promo_codes(is_active);

create index idx_promo_codes_expires on promo_codes(expires_at);

-- Leads
create index idx_leads_email on leads(email);

-- Contact Us Indexes
create index idx_contact_status on contact_us(status);

create index idx_contact_created_at on contact_us(created_at desc);

create index idx_backups_created_at on backups(created_at desc);

-- =============================================================================
-- Source: 20260220120002_cart_items_upsert_function.sql
-- =============================================================================

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
-- Ensures one cart item per (cart_id, customised_product_id)
--------------------------------------------------
DROP INDEX IF EXISTS cart_items_unique_active;

DROP INDEX IF EXISTS cart_items_unique_cart_variant;

CREATE UNIQUE INDEX cart_items_unique_cart_variant
ON cart_items (cart_id, customised_product_id);

-- 2) Create index on session_id for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_session_id
ON orders (session_id);

-- Create index for session_id lookups
create index idx_wishlist_session_id on wishlists(session_id);

-- Create index for session_id lookups
create index idx_product_views_session_id on product_views(session_id);

-- Create index for user_id lookups (if not already exists)
create index if not exists idx_product_views_user_id on product_views(user_id);

-- 3. Cart items unique index (full, not partial)
DROP INDEX IF EXISTS cart_items_unique_active;

DROP INDEX IF EXISTS cart_items_unique_cart_variant;

CREATE UNIQUE INDEX cart_items_unique_cart_variant
ON cart_items (cart_id, customised_product_id);

CREATE INDEX IF NOT EXISTS idx_orders_promo_code_id ON public.orders(promo_code_id);

CREATE INDEX IF NOT EXISTS idx_products_min_effective_price
  ON public.products (min_effective_price);

CREATE INDEX IF NOT EXISTS idx_products_max_effective_price
  ON public.products (max_effective_price);

---------------------------------------------------
-- 2. Partial unique index: one guest cart per session
---------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS carts_unique_guest_session
ON carts (session_id)
WHERE user_id IS NULL AND session_id IS NOT NULL;

---------------------------------------------------
-- 3. Unique index + drop obsolete non-unique index
---------------------------------------------------

DROP INDEX IF EXISTS idx_leads_email;

CREATE UNIQUE INDEX leads_email_normalized_uidx
  ON leads (lower(trim(email)));

create index if not exists idx_leads_user_id on public.leads (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS leads_unsubscribe_token_uidx
  ON public.leads (unsubscribe_token);

---------------------------------------------------
-- 3. Unique indexes
---------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_variant_uidx
  ON wishlists (user_id, customised_product_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS wishlists_session_variant_uidx
  ON wishlists (session_id, customised_product_id)
  WHERE user_id IS NULL AND session_id IS NOT NULL;

---------------------------------------------------
-- 4. Unique index (COALESCE so null attrs still collide)
---------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS customised_products_product_attrs_uidx
  ON customised_products (
    product_id,
    coalesce(color, ''),
    coalesce(size, ''),
    coalesce(material, '')
  );

-- ----- comments -----

COMMENT ON COLUMN public.orders.stock_restored IS
  'True after order line quantities have been returned to customised_products.quantity_stock';

COMMENT ON COLUMN public.orders.shipping_zone_id IS
  'Shipping zone selected at checkout; SET NULL if zone is deleted.';

COMMENT ON COLUMN public.orders.shipping_zone_name IS
  'Immutable zone name snapshot at checkout (survives zone rename/delete).';

COMMENT ON COLUMN public.products.min_effective_price IS
  'Min COALESCE(variant price_override, base price) across variants; equals price when no variants.';

COMMENT ON COLUMN public.products.max_effective_price IS
  'Max COALESCE(variant price_override, base price) across variants; equals price when no variants.';

-- ----- data_fixups -----

-- Handle existing rows where user_id is null (if any)
-- Set a temporary session_id for existing null user_id rows to satisfy constraint
-- Note: This should not happen in practice, but we handle it for safety
update wishlists
set session_id = gen_random_uuid()::text
where user_id is null and session_id is null;

-- ============================================================
-- Source: 20260714190001_require_product_slug.sql
-- ============================================================

-- Backfill null/empty product slugs, then require slug going forward.
-- Storefront routes are /products/[slug]; links with null/id 404 against getProductBySlug.

UPDATE products
SET slug = left(
  trim(
    both '-'
    from regexp_replace(
      lower(coalesce(nullif(btrim(name), ''), 'product')),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  )
  || '-'
  || left(replace(id::text, '-', ''), 8),
  40
)
WHERE slug IS NULL OR btrim(slug) = '';

-- Backfill from variants (no variants â†’ base price)
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

-- ============================================================
-- Source: 20260719143000_carts_unique_guest_session.sql
-- ============================================================

-- Enforce one open guest cart per session_id.
-- Carts have no status column; checkout hard-deletes the cart row.
-- Concurrent guest ATC previously could insert multiple carts for the same
-- session; lookups used created_at DESC LIMIT 1 and orphaned older rows.

---------------------------------------------------
-- 1. Dedupe orphan guest carts (keep newest per session_id)
---------------------------------------------------

-- Identify keeper cart (newest) per guest session with duplicates
CREATE TEMP TABLE _guest_cart_keepers AS
SELECT DISTINCT ON (session_id)
  id AS keeper_id,
  session_id
FROM carts
WHERE user_id IS NULL
  AND session_id IS NOT NULL
ORDER BY session_id, created_at DESC, id DESC;

-- Older carts for the same session (to merge then delete)
CREATE TEMP TABLE _guest_cart_orphans AS
SELECT c.id AS orphan_id, k.keeper_id
FROM carts c
JOIN _guest_cart_keepers k ON k.session_id = c.session_id
WHERE c.user_id IS NULL
  AND c.session_id IS NOT NULL
  AND c.id <> k.keeper_id;

-- When orphan and keeper share the same variant: sum qty onto keeper, drop orphan row
UPDATE cart_items AS keeper
SET quantity = keeper.quantity + orphan.quantity
FROM cart_items AS orphan
JOIN _guest_cart_orphans o ON o.orphan_id = orphan.cart_id
WHERE keeper.cart_id = o.keeper_id
  AND keeper.customised_product_id = orphan.customised_product_id;

DELETE FROM cart_items AS orphan
USING _guest_cart_orphans o, cart_items AS keeper
WHERE orphan.cart_id = o.orphan_id
  AND keeper.cart_id = o.keeper_id
  AND keeper.customised_product_id = orphan.customised_product_id;

-- Move remaining orphan items onto the keeper cart
UPDATE cart_items AS orphan
SET cart_id = o.keeper_id
FROM _guest_cart_orphans o
WHERE orphan.cart_id = o.orphan_id;

-- Delete orphan cart rows (any leftover items cascade-delete)
DELETE FROM carts c
USING _guest_cart_orphans o
WHERE c.id = o.orphan_id;

DROP TABLE _guest_cart_orphans;

DROP TABLE _guest_cart_keepers;

-- ============================================================
-- Source: 20260719151000_leads_unique_normalized_email.sql
-- ============================================================

-- Enforce one lead per normalized email (lower(trim(email))).
-- Public re-subscribe becomes idempotent; admin create/update gets clear conflicts.

---------------------------------------------------
-- 1. Dedupe (keep earliest created_at per normalized email)
---------------------------------------------------

CREATE TEMP TABLE _lead_keepers AS
SELECT DISTINCT ON (lower(trim(email)))
  id AS keeper_id,
  lower(trim(email)) AS email_key
FROM leads
ORDER BY lower(trim(email)), created_at ASC NULLS LAST, id ASC;

DELETE FROM leads AS l
USING _lead_keepers k
WHERE lower(trim(l.email)) = k.email_key
  AND l.id <> k.keeper_id;

DROP TABLE _lead_keepers;

---------------------------------------------------
-- 2. Normalize remaining emails
---------------------------------------------------

UPDATE leads
SET email = lower(trim(email));

-- Backfill existing rows before NOT NULL / defaults
UPDATE public.leads
SET
  status = COALESCE(status, 'subscribed'),
  source = COALESCE(source, 'footer'),
  unsubscribe_token = COALESCE(unsubscribe_token, gen_random_uuid())
WHERE status IS NULL
   OR source IS NULL
   OR unsubscribe_token IS NULL;

-- ============================================================
-- Source: 20260719170000_wishlists_unique_owner_variant.sql
-- ============================================================

-- Unique wishlist ownership per variant (auth user and guest session).
-- Dedupes keep the newest row so claim + concurrent toggles cannot double-insert.

---------------------------------------------------
-- 1. Dedupe user wishlist rows (keep newest per user + variant)
---------------------------------------------------

DELETE FROM wishlists AS w
USING wishlists AS newer
WHERE w.user_id IS NOT NULL
  AND newer.user_id IS NOT NULL
  AND w.user_id = newer.user_id
  AND w.customised_product_id = newer.customised_product_id
  AND (
    newer.created_at > w.created_at
    OR (newer.created_at = w.created_at AND newer.id > w.id)
  );

---------------------------------------------------
-- 2. Dedupe guest wishlist rows (keep newest per session + variant)
---------------------------------------------------

DELETE FROM wishlists AS w
USING wishlists AS newer
WHERE w.user_id IS NULL
  AND w.session_id IS NOT NULL
  AND newer.user_id IS NULL
  AND newer.session_id IS NOT NULL
  AND w.session_id = newer.session_id
  AND w.customised_product_id = newer.customised_product_id
  AND (
    newer.created_at > w.created_at
    OR (newer.created_at = w.created_at AND newer.id > w.id)
  );

-- ============================================================
-- Source: 20260720180000_require_category_slug.sql
-- ============================================================

-- Backfill null/empty category slugs, then require slug going forward.
-- Storefront filters by category slug (/products?category=...); null/empty breaks links.

UPDATE categories
SET slug = left(
  trim(
    both '-'
    from regexp_replace(
      lower(coalesce(nullif(btrim(name), ''), 'category')),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  )
  || '-'
  || left(replace(id::text, '-', ''), 8),
  20
)
WHERE slug IS NULL OR btrim(slug) = '';

-- ============================================================
-- Source: 20260720181000_customised_products_unique_attrs.sql
-- ============================================================

-- Unique variant attributes per product (color + size + material).
-- Dedupes keep the newest row; dependent FKs are remapped before delete.

---------------------------------------------------
-- 1. Temp map: older duplicate â†’ newest keeper
---------------------------------------------------

CREATE TEMP TABLE _variant_dedupe_map ON COMMIT DROP AS
WITH ranked AS (
  SELECT
    id,
    product_id,
    coalesce(color, '') AS color_key,
    coalesce(size, '') AS size_key,
    coalesce(material, '') AS material_key,
    ROW_NUMBER() OVER (
      PARTITION BY
        product_id,
        coalesce(color, ''),
        coalesce(size, ''),
        coalesce(material, '')
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM customised_products
),
keepers AS (
  SELECT id, product_id, color_key, size_key, material_key
  FROM ranked
  WHERE rn = 1
)
SELECT
  r.id AS loser_id,
  k.id AS keeper_id
FROM ranked r
JOIN keepers k
  ON k.product_id = r.product_id
 AND k.color_key = r.color_key
 AND k.size_key = r.size_key
 AND k.material_key = r.material_key
WHERE r.rn > 1;

---------------------------------------------------
-- 2. Drop wishlist/cart rows that would uniquely collide after remap
---------------------------------------------------

DELETE FROM wishlists w
USING _variant_dedupe_map m
WHERE w.customised_product_id = m.loser_id
  AND EXISTS (
    SELECT 1
    FROM wishlists k
    WHERE k.customised_product_id = m.keeper_id
      AND (
        (w.user_id IS NOT NULL AND k.user_id = w.user_id)
        OR (
          w.user_id IS NULL
          AND w.session_id IS NOT NULL
          AND k.user_id IS NULL
          AND k.session_id = w.session_id
        )
      )
  );

DELETE FROM cart_items ci
USING _variant_dedupe_map m
WHERE ci.customised_product_id = m.loser_id
  AND EXISTS (
    SELECT 1
    FROM cart_items k
    WHERE k.customised_product_id = m.keeper_id
      AND k.cart_id = ci.cart_id
  );

---------------------------------------------------
-- 3. Remap remaining FKs, then delete losers
---------------------------------------------------

UPDATE wishlists w
SET customised_product_id = m.keeper_id
FROM _variant_dedupe_map m
WHERE w.customised_product_id = m.loser_id;

UPDATE cart_items ci
SET customised_product_id = m.keeper_id
FROM _variant_dedupe_map m
WHERE ci.customised_product_id = m.loser_id;

UPDATE order_items oi
SET customised_product_id = m.keeper_id
FROM _variant_dedupe_map m
WHERE oi.customised_product_id = m.loser_id;

DELETE FROM customised_products cp
USING _variant_dedupe_map m
WHERE cp.id = m.loser_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'deleted_at'
  ) THEN
    UPDATE profiles SET is_active = (deleted_at IS NULL);
  END IF;
END $$;

-- 2. Purge soft-deleted rows (order matters for FKs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cart_items' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM cart_items WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'carts' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM carts WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlists' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM wishlists WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM reviews WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_addresses' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM user_addresses WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM order_items WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM payments WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shipments' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM shipments WHERE deleted_at IS NOT NULL;
  END IF;

  -- Orders with soft-delete: remove payments/shipments first then orders
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE deleted_at IS NOT NULL);
    DELETE FROM shipments WHERE order_id IN (SELECT id FROM orders WHERE deleted_at IS NOT NULL);
    DELETE FROM orders WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customised_products' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM wishlists WHERE customised_product_id IN (
      SELECT id FROM customised_products WHERE deleted_at IS NOT NULL
    );
    DELETE FROM cart_items WHERE customised_product_id IN (
      SELECT id FROM customised_products WHERE deleted_at IS NOT NULL
    );
    DELETE FROM customised_products WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM product_questions WHERE product_id IN (SELECT id FROM products WHERE deleted_at IS NOT NULL);
    DELETE FROM product_views WHERE product_id IN (SELECT id FROM products WHERE deleted_at IS NOT NULL);
    DELETE FROM product_stats WHERE product_id IN (SELECT id FROM products WHERE deleted_at IS NOT NULL);
    DELETE FROM products WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'deleted_at'
  ) THEN
    UPDATE products SET category_id = NULL WHERE category_id IN (
      SELECT id FROM categories WHERE deleted_at IS NOT NULL
    );
    UPDATE categories SET parent_id = NULL WHERE parent_id IN (
      SELECT id FROM categories WHERE deleted_at IS NOT NULL
    );
    DELETE FROM categories WHERE deleted_at IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'brands' AND column_name = 'deleted_at'
  ) THEN
    UPDATE products SET brand_id = NULL WHERE brand_id IN (
      SELECT id FROM brands WHERE deleted_at IS NOT NULL
    );
    DELETE FROM brands WHERE deleted_at IS NOT NULL;
  END IF;
END $$;

