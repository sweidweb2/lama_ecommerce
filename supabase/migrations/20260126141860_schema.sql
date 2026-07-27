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

-- --------------------------------------------------
-- TRIGGERS
-- --------------------------------------------------

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to tables that have updated_at column
create trigger update_carts_updated_at before update on carts
  for each row execute function update_updated_at_column();

create trigger update_products_updated_at before update on products
  for each row execute function update_updated_at_column();

create trigger update_orders_updated_at before update on orders
  for each row execute function update_updated_at_column();


-- =============================================================================
-- Source: 20260128101527_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- Row Level Security (RLS) & Basic Policies
-- Initial setup: deny by default, then allow:
-- - Public read where appropriate
-- - Users to access ONLY their own data
--
-- NOTE: Admin/service operations should use the
-- Supabase service role (bypasses RLS).
--------------------------------------------------

--------------------------------------------------
-- Enable RLS on all tables
--------------------------------------------------

alter table profiles            enable row level security;
alter table user_addresses      enable row level security;
alter table brands              enable row level security;
alter table categories          enable row level security;
alter table products            enable row level security;
alter table product_images      enable row level security;
alter table customised_products enable row level security;
alter table wishlists           enable row level security;
alter table carts               enable row level security;
alter table cart_items          enable row level security;
alter table reviews             enable row level security;
alter table product_questions   enable row level security;
alter table product_answers     enable row level security;
alter table orders              enable row level security;
alter table order_items         enable row level security;
alter table payments            enable row level security;
alter table shipping_zones      enable row level security;
alter table shipping_fees       enable row level security;
alter table shipments           enable row level security;
alter table product_views       enable row level security;
alter table product_stats       enable row level security;
alter table leads               enable row level security;
alter table contact_us          enable row level security;
alter table promo_codes         enable row level security;


-- =============================================================================
-- Source: 20260201000000_profiles_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- Fragment 2.2: Profiles RLS Policies
-- 
-- Goal: Database enforces access; frontend cannot bypass it.
--
-- Global Auth Assumptions:
-- - auth.uid() Ã¢â€ â€™ current authenticated user ID
-- - User role is read from profiles.role
-- - Never trust a role coming from the frontend
--------------------------------------------------

--------------------------------------------------
-- Helper Function: Get Current User Role
-- 
-- This function retrieves the role of the currently authenticated user
-- from the profiles table. Used in RLS policies that need role-based checks.
--
-- Returns:
-- - 'user' | 'admin' | null (if user not found or not authenticated)
--------------------------------------------------
create or replace function public.get_user_role()
returns profile_role as $$
declare
  user_role profile_role;
begin
  select role into user_role
  from public.profiles
  where user_id = auth.uid()
  limit 1;
  
  return coalesce(user_role, 'user'::profile_role);
end;
$$ language plpgsql security definer stable;

-- Grant execute permission to authenticated users
grant execute on function public.get_user_role() to authenticated;

--------------------------------------------------
-- Trigger: Prevent Users from Changing Own Role
-- 
-- This trigger ensures users cannot change their own role.
-- Only admins (via service role) can change user roles.
--------------------------------------------------
create or replace function public.prevent_role_change()
returns trigger as $$
begin
  -- If the role is being changed and the user is updating their own profile
  if old.role is distinct from new.role 
     and new.user_id = auth.uid() 
     and old.user_id = auth.uid() then
    -- Prevent the role change
    raise exception 'Users cannot change their own role. Contact an administrator.';
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger
create trigger prevent_user_role_change
before update on profiles
for each row
execute function public.prevent_role_change();

--------------------------------------------------
-- Profiles RLS Policies
--------------------------------------------------

--------------------------------------------------
-- User Capabilities
--------------------------------------------------

-- Policy: Users can read their own profile
create policy "Users can view own profile"
on profiles
for select
using (auth.uid() = user_id);

-- Policy: Users can update their own profile
-- BUT: Users cannot update their own role (role changes require admin)
-- 
-- Note: This policy allows users to update their profile fields (full_name, etc.)
-- Role changes are prevented via a trigger (see below).
create policy "Users can update own profile"
on profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

--------------------------------------------------
-- Admin Capabilities
-- 
-- Note: For now, admin operations should use the Supabase service role
-- (which bypasses RLS). In Phase 3+, we can add admin-specific RLS policies
-- that use get_user_role() to check for admin role.
--
-- Example future policy (commented out for Phase 3+):
-- create policy "Admins can read all profiles"
-- on profiles
-- for select
-- using (public.get_user_role() = 'admin'::profile_role);
--
-- create policy "Admins can update roles"
-- on profiles
-- for update
-- using (public.get_user_role() = 'admin'::profile_role)
-- with check (public.get_user_role() = 'admin'::profile_role);
--------------------------------------------------

-- For Phase 2, admins use service role to bypass RLS
-- This is documented in the codebase and enforced via middleware + server actions

--------------------------------------------------
-- Security Notes
--------------------------------------------------
-- 
-- 1. All profile access is restricted by default (deny all)
-- 2. Users can only see/update their own profile
-- 3. Users CANNOT change their own role (enforced in update policy)
-- 4. Admin operations use service role (bypasses RLS) for now
-- 5. Future: Add admin RLS policies in Phase 3+ using get_user_role()
-- 6. Never trust role data from frontend - always read from database
--


-- =============================================================================
-- Source: 20260202000000_wishlist_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- Wishlist RLS Policies
--------------------------------------------------

-- Policy: Users can view their own wishlist items
create policy "Users can view own wishlist items"
on wishlists
for select
using (auth.uid() = user_id);

-- Policy: Users can insert their own wishlist items
create policy "Users can insert own wishlist items"
on wishlists
for insert
with check (auth.uid() = user_id);

-- Policy: Users can delete their own wishlist items
create policy "Users can delete own wishlist items"
on wishlists
for delete
using (auth.uid() = user_id);


-- =============================================================================
-- Source: 20260210180000_contact_us_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- RLS policies for contact_us (public contact form)
--------------------------------------------------

-- Always enable RLS explicitly (important for migrations)
alter table contact_us enable row level security;

--------------------------------------------------
-- Drop existing policies (safe for re-runs)
--------------------------------------------------
drop policy if exists "Public can submit contact form" on contact_us;
drop policy if exists "Admins can read contact messages" on contact_us;

--------------------------------------------------
-- Allow anyone (anonymous + authenticated) to submit the form
--------------------------------------------------
create policy "Public can submit contact form"
on contact_us
for insert
to public
with check (true);

--------------------------------------------------
-- Allow admins to read all contact messages
--------------------------------------------------
create policy "Admins can read contact messages"
on contact_us
for select
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
);


-- =============================================================================
-- Source: 20260210180100_contact_us_admin_update_delete.sql
-- =============================================================================

--------------------------------------------------
-- Allow admins to update and delete contact messages
--------------------------------------------------

drop policy if exists "Admins can update contact messages" on contact_us;
drop policy if exists "Admins can delete contact messages" on contact_us;

create policy "Admins can update contact messages"
on contact_us
for update
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete contact messages"
on contact_us
for delete
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
);


-- =============================================================================
-- Source: 20260215000000_brands_admin_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- Brands RLS Policies for Admins
--
-- Goal: Allow only admins to read, insert, update, and delete
--       rows in the `brands` table.
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
--------------------------------------------------

-- Admins can fully manage brands (CRUD)
create policy "Admins can manage brands"
on brands
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);


-- =============================================================================
-- Source: 20260216000000_storage_brands_policies.sql
-- =============================================================================

-- Admin upload policy for brands bucket

create policy "Admins can upload brand images"
on storage.objects
for insert
with check (
  bucket_id = 'brands'
  and auth.role() = 'authenticated'
  and public.get_user_role() = 'admin'::profile_role
);


-- =============================================================================
-- Source: 20260217000000_categories_admin_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- Categories RLS Policies for Admins
--
-- Goal: Allow only admins to read, insert, update, and delete
--       rows in the `categories` table.
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
--------------------------------------------------

-- Admins can fully manage categories (CRUD)
create policy "Admins can manage categories"
on categories
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);


-- =============================================================================
-- Source: 20260218000000_profiles_admin_rls_and_function.sql
-- =============================================================================

--------------------------------------------------
-- Profiles: Admin RLS policies and get_admin_profiles()
--
-- - Admins can SELECT all profiles (for users table).
-- - Admins can UPDATE any profile (full_name, role; own-role change still blocked by trigger).
-- - Admins can set is_active via UPDATE.
-- - get_admin_profiles(): returns profiles joined with auth.users email for admin only.
--------------------------------------------------

-- Admins can read all profiles
create policy "Admins can read all profiles"
on profiles
for select
using (public.get_user_role() = 'admin'::profile_role);

-- Admins can update any profile (e.g. full_name, role, is_active)
create policy "Admins can update any profile"
on profiles
for update
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- Function: get_admin_profiles()
-- Returns profile rows plus email from auth.users.
-- Only executable by admins; otherwise returns no rows.
--------------------------------------------------
create or replace function public.get_admin_profiles()
returns table (
  id uuid,
  user_id uuid,
  full_name text,
  role profile_role,
  created_at timestamptz,
  is_active boolean,
  email text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_user_role() != 'admin'::profile_role then
    return;
  end if;
  return query
  select
    p.id,
    p.user_id,
    p.full_name,
    p.role,
    p.created_at,
    p.is_active,
    u.email::text
  from public.profiles p
  join auth.users u on u.id = p.user_id;
end;
$$;

grant execute on function public.get_admin_profiles() to authenticated;


-- =============================================================================
-- Source: 20260219152635_products_admin_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- Products RLS Policies for Admins
--
-- Goal: Allow only admins to read, insert, update,
--       and delete rows in the `products` table.
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
--------------------------------------------------

-- Safe to re-run: drop if exists
drop policy if exists "Admins can manage products" on products;

-- Admins can fully manage products (CRUD)
create policy "Admins can manage products"
on products
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);


-- =============================================================================
-- Source: 20260219152636_product_images_admin_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- Product Images RLS Policies for Admins
--
-- Goal: Allow only admins to read, insert, update, and delete
--       rows in the `product_images` table.
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
--------------------------------------------------

-- Admins can fully manage product images (CRUD)
create policy "Admins can manage product_images"
on product_images
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);


-- =============================================================================
-- Source: 20260219152637_storage_products_policies.sql
-- =============================================================================

-- Admin upload policy for products bucket

create policy "Admins can upload product images"
on storage.objects
for insert
with check (
  bucket_id = 'products'
  and auth.role() = 'authenticated'
  and public.get_user_role() = 'admin'::profile_role
);


-- =============================================================================
-- Source: 20260219152638_leads_rls_policies.sql
-- =============================================================================

-- RLS policies for leads (newsletter / email signup)

alter table leads enable row level security;

-- Allow anyone to submit their email (footer signup)
create policy "Public can insert leads"
on leads
for insert
to public
with check (true);

-- Allow admins to read all leads (for admin panel when using session client)
create policy "Admins can read leads"
on leads
for select
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
);


-- =============================================================================
-- Source: 20260219152639_storage_products_delete_policy.sql
-- =============================================================================

-- Admin delete policy for products bucket

create policy "Admins can delete product images"
on storage.objects
for delete
using (
  bucket_id = 'products'
  and auth.role() = 'authenticated'
  and public.get_user_role() = 'admin'::profile_role
);


-- =============================================================================
-- Source: 20260219152640_customised_products_admin_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- Customised Products (Product Variants) RLS Policies for Admins
--
-- Goal: Allow only admins to read, insert, update, and delete
--       rows in the `customised_products` table.
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
--------------------------------------------------

-- Safe to re-run: drop if exists
drop policy if exists "Admins can manage customised_products" on customised_products;

-- Admins can fully manage customised products (CRUD)
create policy "Admins can manage customised_products"
on customised_products
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);


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

create index idx_backups_created_at on backups(created_at desc);

alter table backups enable row level security;

-- Only service role (admin client) is used for backup operations; no public policies.


-- =============================================================================
-- Source: 20260220110001_products_public_read_policy.sql
-- =============================================================================

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
  exists (
    select 1 from products
    where products.id = customised_products.product_id
    and products.is_active = true
  )
);


-- =============================================================================
-- Source: 20260220110002_user_addresses_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- User Addresses RLS Policies
-- Users can only select, insert, update, and delete their own addresses.
--------------------------------------------------

create policy "Users can manage own addresses (select)"
on user_addresses
for select
using (auth.uid() = user_id);

create policy "Users can manage own addresses (insert)"
on user_addresses
for insert
with check (auth.uid() = user_id);

create policy "Users can manage own addresses (update)"
on user_addresses
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own addresses (delete)"
on user_addresses
for delete
using (auth.uid() = user_id);


-- =============================================================================
-- Source: 20260220120000_reviews_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- Reviews RLS Policies
--
-- Goal: 
-- - Users can read approved reviews and insert their own reviews
-- - Admins can do all operations (SELECT, INSERT, UPDATE, DELETE)
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
-- - auth.uid() for user identification
--------------------------------------------------

-- Users can read approved reviews (not deleted) or their own reviews
drop policy if exists "Users can read reviews" on reviews;
create policy "Users can read reviews"
on reviews
for select
using (
  (
    review_status = 'approved'  -- Can read all approved reviews
    or auth.uid() = user_id     -- Or their own reviews (even if pending/rejected)
  )
);

-- Users can insert their own reviews
drop policy if exists "Users can insert own reviews" on reviews;
create policy "Users can insert own reviews"
on reviews
for insert
with check (
  auth.uid() = user_id
  and review_status = 'pending'  -- New reviews start as pending
);

-- Admins can do all operations on reviews
drop policy if exists "Admins can manage reviews" on reviews;
create policy "Admins can manage reviews"
on reviews
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);


-- =============================================================================
-- Source: 20260220120001_carts_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- Carts & Cart Items RLS Policies
--
-- Goal: 
-- - Users can manage their own carts (user_id = auth.uid())
-- - Guests can manage carts where user_id is null (session_id handled in app code)
-- - Admins can do all operations (SELECT, INSERT, UPDATE, DELETE)
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
-- - auth.uid() for user identification
--------------------------------------------------

--------------------------------------------------
-- CARTS TABLE POLICIES
--------------------------------------------------

-- Users can read their own carts (not deleted)
drop policy if exists "Users can read own carts" on carts;
create policy "Users can read own carts"
on carts
for select
using (
  (
    user_id = auth.uid()  -- Authenticated users: their own carts
    or (user_id is null)  -- Guests: carts with no user_id (session_id handled in app)
  )
);

-- Users can insert their own carts
drop policy if exists "Users can insert own carts" on carts;
create policy "Users can insert own carts"
on carts
for insert
with check (
  (user_id = auth.uid() or user_id is null)  -- Can create cart for themselves or as guest
);

-- Users can update their own carts
drop policy if exists "Users can update own carts" on carts;
create policy "Users can update own carts"
on carts
for update
using (
  (
    user_id = auth.uid()  -- Authenticated users: their own carts
    or (user_id is null)  -- Guests: carts with no user_id
  )
)
with check (
  (
    user_id = auth.uid()  -- Authenticated users: their own carts
    or (user_id is null)  -- Guests: carts with no user_id
  )
);

-- Users can delete their own carts
drop policy if exists "Users can delete own carts" on carts;
create policy "Users can delete own carts"
on carts
for delete
using (
  (
    user_id = auth.uid()  -- Authenticated users: their own carts
    or (user_id is null)  -- Guests: carts with no user_id
  )
);

-- Admins can do all operations on carts
drop policy if exists "Admins can manage carts" on carts;
create policy "Admins can manage carts"
on carts
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- CART ITEMS TABLE POLICIES
--------------------------------------------------

-- Users can read cart items from their own carts (not deleted)
drop policy if exists "Users can read own cart items" on cart_items;
create policy "Users can read own cart items"
on cart_items
for select
using (
  exists (
    select 1
    from carts c
    where c.id = cart_items.cart_id
      and (
        c.user_id = auth.uid()  -- Authenticated users: their own carts
        or c.user_id is null    -- Guests: carts with no user_id
      )
  )
);

-- Users can insert cart items into their own carts
drop policy if exists "Users can insert own cart items" on cart_items;
create policy "Users can insert own cart items"
on cart_items
for insert
with check (
  exists (
    select 1
    from carts c
    where c.id = cart_id
      and (
        c.user_id = auth.uid()  -- Authenticated users: their own carts
        or c.user_id is null    -- Guests: carts with no user_id
      )
  )
);

-- Users can update cart items in their own carts
drop policy if exists "Users can update own cart items" on cart_items;
create policy "Users can update own cart items"
on cart_items
for update
using (
  exists (
    select 1
    from carts c
    where c.id = cart_id
      and (
        c.user_id = auth.uid()  -- Authenticated users: their own carts
        or c.user_id is null    -- Guests: carts with no user_id
      )
  )
)
with check (
  exists (
    select 1
    from carts c
    where c.id = cart_id
      and (
        c.user_id = auth.uid()  -- Authenticated users: their own carts
        or c.user_id is null    -- Guests: carts with no user_id
      )
  )
);

-- Users can delete cart items from their own carts
drop policy if exists "Users can delete own cart items" on cart_items;
create policy "Users can delete own cart items"
on cart_items
for delete
using (
  exists (
    select 1
    from carts c
    where c.id = cart_id
      and (
        c.user_id = auth.uid()  -- Authenticated users: their own carts
        or c.user_id is null    -- Guests: carts with no user_id
      )
  )
);

-- Admins can do all operations on cart items
drop policy if exists "Admins can manage cart items" on cart_items;
create policy "Admins can manage cart items"
on cart_items
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);


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
  WHERE id = p_customised_product_id;
  
  IF v_available_stock IS NULL THEN
    RAISE EXCEPTION 'Product variant not found';
  END IF;
  
  IF v_available_stock <= 0 THEN
    RAISE EXCEPTION 'Product variant is out of stock';
  END IF;
  
  -- 2. Try to update existing cart item
  UPDATE cart_items
  SET quantity = quantity + p_quantity
  WHERE cart_id = p_cart_id
    AND customised_product_id = p_customised_product_id
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

-- 2) Create index on session_id for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_session_id
ON orders (session_id);


-- =============================================================================
-- Source: 20260220120004_orders_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- Orders & Order Items RLS Policies
--
-- Goal:
-- - Authenticated users can manage their own orders (orders.user_id = auth.uid())
-- - Guests can manage orders where user_id is null (session_id handled in app code)
-- - Admins can do all operations (SELECT, INSERT, UPDATE, DELETE)
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
-- - auth.uid() for user identification
--------------------------------------------------

--------------------------------------------------
-- ORDERS TABLE POLICIES
--------------------------------------------------

-- Users can read their own orders (not deleted)
drop policy if exists "Users can read own orders" on orders;
create policy "Users can read own orders"
on orders
for select
using (
  (
    user_id = auth.uid()      -- Authenticated users: their own orders
    or (user_id is null)      -- Guests: orders with no user_id (session_id handled in app)
  )
);

-- Users can insert their own orders (or as guests)
drop policy if exists "Users can insert own orders" on orders;
create policy "Users can insert own orders"
on orders
for insert
with check (
  (user_id = auth.uid() or user_id is null)  -- Can create order for themselves or as guest
);

-- Users can update their own orders
drop policy if exists "Users can update own orders" on orders;
create policy "Users can update own orders"
on orders
for update
using (
  (
    user_id = auth.uid()      -- Authenticated users: their own orders
    or (user_id is null)      -- Guests: orders with no user_id
  )
)
with check (
  (
    user_id = auth.uid()      -- Authenticated users: their own orders
    or (user_id is null)      -- Guests: orders with no user_id
  )
);

-- Users can delete their own orders
drop policy if exists "Users can delete own orders" on orders;
create policy "Users can delete own orders"
on orders
for delete
using (
  (
    user_id = auth.uid()      -- Authenticated users: their own orders
    or (user_id is null)      -- Guests: orders with no user_id
  )
);

-- Admins can do all operations on orders
drop policy if exists "Admins can manage orders" on orders;
create policy "Admins can manage orders"
on orders
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- ORDER ITEMS TABLE POLICIES
--------------------------------------------------

-- Users can read order items from their own orders (not deleted)
drop policy if exists "Users can read own order items" on order_items;
create policy "Users can read own order items"
on order_items
for select
using (
  exists (
    select 1
    from orders o
    where o.id = order_items.order_id
      and (
        o.user_id = auth.uid()    -- Authenticated users: their own orders
        or o.user_id is null      -- Guests: orders with no user_id (session_id handled in app)
      )
  )
);

-- Users can insert order items into their own orders
drop policy if exists "Users can insert own order items" on order_items;
create policy "Users can insert own order items"
on order_items
for insert
with check (
  exists (
    select 1
    from orders o
    where o.id = order_id
      and (
        o.user_id = auth.uid()    -- Authenticated users: their own orders
        or o.user_id is null      -- Guests: orders with no user_id
      )
  )
);

-- Users can update order items in their own orders
drop policy if exists "Users can update own order items" on order_items;
create policy "Users can update own order items"
on order_items
for update
using (
  exists (
    select 1
    from orders o
    where o.id = order_id
      and (
        o.user_id = auth.uid()    -- Authenticated users: their own orders
        or o.user_id is null      -- Guests: orders with no user_id
      )
  )
)
with check (
  exists (
    select 1
    from orders o
    where o.id = order_id
      and (
        o.user_id = auth.uid()    -- Authenticated users: their own orders
        or o.user_id is null      -- Guests: orders with no user_id
      )
  )
);

-- Users can delete order items from their own orders
drop policy if exists "Users can delete own order items" on order_items;
create policy "Users can delete own order items"
on order_items
for delete
using (
  exists (
    select 1
    from orders o
    where o.id = order_id
      and (
        o.user_id = auth.uid()    -- Authenticated users: their own orders
        or o.user_id is null      -- Guests: orders with no user_id
      )
  )
);

-- Admins can do all operations on order items
drop policy if exists "Admins can manage order items" on order_items;
create policy "Admins can manage order items"
on order_items
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);


-- =============================================================================
-- Source: 20260220120005_checkout_function.sql
-- =============================================================================

--------------------------------------------------
-- Checkout Function Ã¢â‚¬â€œ Atomic Order Creation
--
-- Goal:
-- - Validate stock for all cart items
-- - Create order + order_items (snapshots)
-- - Decrement stock atomically
-- - Soft-delete cart + cart_items
-- - Handle both logged-in users and guests
--
-- Depends on:
-- - carts, cart_items, orders, order_items, customised_products, products
--------------------------------------------------

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_cart_id       uuid,
  p_user_id       uuid       DEFAULT NULL,
  p_session_id    text       DEFAULT NULL,
  p_shipping_fee  numeric    DEFAULT 0,
  p_discount      numeric    DEFAULT 0,
  p_phone         text       DEFAULT NULL,
  p_email         text       DEFAULT NULL,
  p_address_snapshot jsonb   DEFAULT NULL
)
RETURNS uuid -- returns the new order id
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cart           RECORD;
  v_item           RECORD;
  v_subtotal       numeric := 0;
  v_total          numeric;
  v_order_id       uuid;
  v_price          numeric;
  v_item_count     integer := 0;
BEGIN
  -- 1. Validate cart exists and is active
  SELECT * INTO v_cart
  FROM carts
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  -- 2. Validate ownership
  IF p_user_id IS NOT NULL AND v_cart.user_id IS NOT NULL
     AND v_cart.user_id != p_user_id THEN
    RAISE EXCEPTION 'Cart does not belong to this user';
  END IF;

  -- 3. First pass: validate stock for ALL items before any mutation
  FOR v_item IN
    SELECT
      ci.id            AS ci_id,
      ci.customised_product_id,
      ci.quantity,
      cp.quantity_stock,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price          AS base_price,
      p.name           AS product_name
    FROM cart_items ci
    JOIN customised_products cp
      ON cp.id = ci.customised_product_id
    JOIN products p
      ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
     
  LOOP
    v_item_count := v_item_count + 1;

    IF v_item.quantity > v_item.quantity_stock THEN
      RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %',
        v_item.product_name, v_item.quantity, v_item.quantity_stock;
    END IF;

    -- Accumulate subtotal (use price_override if set, else base_price)
    v_price := COALESCE(v_item.price_override, v_item.base_price);
    v_subtotal := v_subtotal + (v_price * v_item.quantity);
  END LOOP;

  -- Cart must have items
  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- 4. Calculate total
  v_total := v_subtotal + COALESCE(p_shipping_fee, 0) - COALESCE(p_discount, 0);
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  -- 5. Create order
  INSERT INTO orders (
    user_id, session_id, status,
    subtotal, shipping_fee, discount, total,
    payment_status,
    address_snapshot, phone, email
  )
  VALUES (
    p_user_id, p_session_id, 'pending',
    v_subtotal, COALESCE(p_shipping_fee, 0), COALESCE(p_discount, 0), v_total,
    'pending',
    p_address_snapshot, p_phone, p_email
  )
  RETURNING id INTO v_order_id;

  -- 6. Second pass: create order_items (snapshots) + decrement stock
  FOR v_item IN
    SELECT
      ci.id            AS ci_id,
      ci.customised_product_id,
      ci.quantity,
      cp.quantity_stock,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price          AS base_price,
      p.name           AS product_name
    FROM cart_items ci
    JOIN customised_products cp
      ON cp.id = ci.customised_product_id
    JOIN products p
      ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
     
  LOOP
    v_price := COALESCE(v_item.price_override, v_item.base_price);

    -- Insert snapshot order item
    INSERT INTO order_items (
      order_id, customised_product_id, quantity,
      price_snapshot, product_name_snapshot,
      size_snapshot, material_snapshot, color_snapshot
    )
    VALUES (
      v_order_id, v_item.customised_product_id, v_item.quantity,
      v_price, v_item.product_name,
      v_item.size, v_item.material, v_item.color
    );

    -- Decrement stock atomically (will fail if another transaction took the stock)
    UPDATE customised_products
    SET quantity_stock = quantity_stock - v_item.quantity
    WHERE id = v_item.customised_product_id
      AND quantity_stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock race condition for "%": stock changed since validation',
        v_item.product_name;
    END IF;
  END LOOP;

  -- 7. Hard-delete cart (cart_items CASCADE)
  DELETE FROM carts
  WHERE id = p_cart_id;

  RETURN v_order_id;
END;
$$;

--------------------------------------------------
-- GRANT EXECUTE PERMISSION
--------------------------------------------------
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) TO service_role;

--------------------------------------------------
-- RELOAD SUPABASE SCHEMA CACHE
--------------------------------------------------
NOTIFY pgrst, 'reload schema';


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

-- Handle existing rows where user_id is null (if any)
-- Set a temporary session_id for existing null user_id rows to satisfy constraint
-- Note: This should not happen in practice, but we handle it for safety
update wishlists
set session_id = gen_random_uuid()::text
where user_id is null and session_id is null;

-- Add constraint: either user_id or session_id must be not null
alter table wishlists
add constraint wishlists_user_or_session_check
check (user_id is not null or session_id is not null);

-- Create index for session_id lookups
create index idx_wishlist_session_id on wishlists(session_id);

--------------------------------------------------
-- DROP EXISTING RLS POLICIES
--------------------------------------------------

-- Drop existing wishlist policies
drop policy if exists "Users can view own wishlist items" on wishlists;
drop policy if exists "Users can insert own wishlist items" on wishlists;
drop policy if exists "Users can delete own wishlist items" on wishlists;

--------------------------------------------------
-- ENABLE RLS (if not already enabled)
--------------------------------------------------

alter table wishlists enable row level security;

--------------------------------------------------
-- NEW RLS POLICIES FOR WISHLISTS
--------------------------------------------------

-- Users can read their own wishlist items (not deleted)
-- Guests can read wishlist items where user_id is null (session_id handled in app code)
create policy "Users and guests can read wishlist items"
on wishlists
for select
using (
  (
    user_id = auth.uid()  -- Authenticated users: their own wishlist items
    or user_id is null     -- Guests: wishlist items with no user_id (session_id handled in app)
  )
);

-- Users can insert their own wishlist items
-- Guests can insert wishlist items where user_id is null
create policy "Users and guests can insert wishlist items"
on wishlists
for insert
with check (
  (user_id = auth.uid() or user_id is null)  -- Can create wishlist item for themselves or as guest
);

-- Users can delete their own wishlist items (not deleted)
-- Guests can delete wishlist items where user_id is null
create policy "Users and guests can delete wishlist items"
on wishlists
for delete
using (
  (
    user_id = auth.uid()  -- Authenticated users: their own wishlist items
    or user_id is null    -- Guests: wishlist items with no user_id
  )
);

-- Admins can do all operations on wishlists
create policy "Admins can manage wishlists"
on wishlists
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);


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

-- Create index for session_id lookups
create index idx_product_views_session_id on product_views(session_id);

-- Create index for user_id lookups (if not already exists)
create index if not exists idx_product_views_user_id on product_views(user_id);


-- =============================================================================
-- Source: 20260221120001_product_views_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- Product Views: RLS Policies
--
-- Goal: 
-- - Enable RLS on product_views table
-- - Allow users/guests to insert their own product views
-- - Allow admins full access (SELECT, INSERT, UPDATE, DELETE) for analytics
--
-- Depends on:
-- - public.get_user_role() returning 'admin'::profile_role
-- - auth.uid() for user identification
-- - session_id column (added in previous migration)
--------------------------------------------------

--------------------------------------------------
-- ENABLE RLS
--------------------------------------------------

alter table product_views enable row level security;

--------------------------------------------------
-- DROP EXISTING RLS POLICIES (if any)
--------------------------------------------------

drop policy if exists "Users and guests can insert product views" on product_views;
drop policy if exists "Admins can manage product views" on product_views;

--------------------------------------------------
-- NEW RLS POLICIES FOR PRODUCT_VIEWS
--------------------------------------------------

-- Users can insert their own product views (user_id = auth.uid())
-- Guests can insert product views where user_id is null (session_id handled in app code)
create policy "Users and guests can insert product views"
on product_views
for insert
with check (
  (user_id = auth.uid() or user_id is null)  -- Can create view for themselves or as guest
);

-- Admins can do all operations on product_views (for analytics and reporting)
create policy "Admins can manage product views"
on product_views
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);


-- =============================================================================
-- Source: 20260221120002_seed_categories.sql
-- =============================================================================

-- Seed categories for testing and development
-- This migration ensures common categories exist in the database

INSERT INTO categories (name, slug, is_active, created_at)
VALUES 
    ('Men', 'men', true, now()),
    ('Women', 'women', true, now()),
    ('Electronics', 'electronics', true, now()),
    ('Fashion', 'fashion', true, now()),
    ('Home & Garden', 'home-garden', true, now()),
    ('Beauty', 'beauty', true, now()),
    ('Sports', 'sports', true, now()),
    ('Toys', 'toys', true, now())
ON CONFLICT (slug) DO NOTHING;


-- =============================================================================
-- Source: 20260221120003_categories_public_read_policy.sql
-- =============================================================================

--------------------------------------------------
-- Categories Public Read Policy
--
-- Goal: Allow anyone (including unauthenticated users/guests) to read
--       categories for the public storefront.
--
-- This policy works alongside the admin policy:
-- - Admins can do all operations (SELECT, INSERT, UPDATE, DELETE)
-- - Public can only SELECT categories (read-only)
--
-- Note: This allows guests and authenticated users to browse categories
--       on the storefront without authentication.
--------------------------------------------------

-- Public can read categories (including non-deleted categories)
drop policy if exists "Public can read categories" on categories;
create policy "Public can read categories"
on categories
for select
using (true);





-- ============================================================
-- Source: 20260712100000_fix_guest_rls_and_checkout_ownership.sql
-- ============================================================

--------------------------------------------------
-- Fix guest RLS + checkout ownership
--
-- Goal:
-- - Remove world-readable/writable guest bypasses (user_id IS NULL)
-- - Authenticated users keep user_id = auth.uid() access
-- - Guest rows are accessed only via service_role from the app
--   (after validating the httpOnly guest_session_id cookie)
-- - Harden process_checkout ownership; revoke anon EXECUTE
-- - Revoke upsert_cart_item from anon
--------------------------------------------------

--------------------------------------------------
-- CARTS TABLE POLICIES
--------------------------------------------------

drop policy if exists "Users can read own carts" on carts;
create policy "Users can read own carts"
on carts
for select
using (
  user_id = auth.uid()
);

drop policy if exists "Users can insert own carts" on carts;
create policy "Users can insert own carts"
on carts
for insert
with check (
  user_id = auth.uid()
);

drop policy if exists "Users can update own carts" on carts;
create policy "Users can update own carts"
on carts
for update
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

drop policy if exists "Users can delete own carts" on carts;
create policy "Users can delete own carts"
on carts
for delete
using (
  user_id = auth.uid()
);

--------------------------------------------------
-- CART ITEMS TABLE POLICIES
--------------------------------------------------

drop policy if exists "Users can read own cart items" on cart_items;
create policy "Users can read own cart items"
on cart_items
for select
using (
  exists (
    select 1
    from carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own cart items" on cart_items;
create policy "Users can insert own cart items"
on cart_items
for insert
with check (
  exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own cart items" on cart_items;
create policy "Users can update own cart items"
on cart_items
for update
using (
  exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own cart items" on cart_items;
create policy "Users can delete own cart items"
on cart_items
for delete
using (
  exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
  )
);

--------------------------------------------------
-- ORDERS TABLE POLICIES
--------------------------------------------------

drop policy if exists "Users can read own orders" on orders;
create policy "Users can read own orders"
on orders
for select
using (
  user_id = auth.uid()
);

drop policy if exists "Users can insert own orders" on orders;
create policy "Users can insert own orders"
on orders
for insert
with check (
  user_id = auth.uid()
);

drop policy if exists "Users can update own orders" on orders;
create policy "Users can update own orders"
on orders
for update
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

drop policy if exists "Users can delete own orders" on orders;
create policy "Users can delete own orders"
on orders
for delete
using (
  user_id = auth.uid()
);

--------------------------------------------------
-- ORDER ITEMS TABLE POLICIES
--------------------------------------------------

drop policy if exists "Users can read own order items" on order_items;
create policy "Users can read own order items"
on order_items
for select
using (
  exists (
    select 1
    from orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own order items" on order_items;
create policy "Users can insert own order items"
on order_items
for insert
with check (
  exists (
    select 1
    from orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own order items" on order_items;
create policy "Users can update own order items"
on order_items
for update
using (
  exists (
    select 1
    from orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own order items" on order_items;
create policy "Users can delete own order items"
on order_items
for delete
using (
  exists (
    select 1
    from orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);

--------------------------------------------------
-- WISHLIST POLICIES
--------------------------------------------------

drop policy if exists "Users and guests can read wishlist items" on wishlists;
drop policy if exists "Users and guests can insert wishlist items" on wishlists;
drop policy if exists "Users and guests can delete wishlist items" on wishlists;
drop policy if exists "Users can view own wishlist items" on wishlists;
drop policy if exists "Users can insert own wishlist items" on wishlists;
drop policy if exists "Users can delete own wishlist items" on wishlists;

create policy "Users can read own wishlist items"
on wishlists
for select
using (
  user_id = auth.uid()
);

create policy "Users can insert own wishlist items"
on wishlists
for insert
with check (
  user_id = auth.uid()
);

create policy "Users can delete own wishlist items"
on wishlists
for delete
using (
  user_id = auth.uid()
);

--------------------------------------------------
-- HARDEN process_checkout
--------------------------------------------------

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_cart_id       uuid,
  p_user_id       uuid       DEFAULT NULL,
  p_session_id    text       DEFAULT NULL,
  p_shipping_fee  numeric    DEFAULT 0,
  p_discount      numeric    DEFAULT 0,
  p_phone         text       DEFAULT NULL,
  p_email         text       DEFAULT NULL,
  p_address_snapshot jsonb   DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart           RECORD;
  v_item           RECORD;
  v_subtotal       numeric := 0;
  v_total          numeric;
  v_order_id       uuid;
  v_price          numeric;
  v_item_count     integer := 0;
BEGIN
  -- 1. Validate cart exists and is active
  SELECT * INTO v_cart
  FROM carts
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  -- 2. Validate ownership (authenticated cart OR guest session cart)
  IF v_cart.user_id IS NOT NULL THEN
    IF p_user_id IS NULL OR v_cart.user_id <> p_user_id THEN
      RAISE EXCEPTION 'Cart does not belong to this user';
    END IF;
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'Cart does not belong to this user';
    END IF;
  ELSIF v_cart.session_id IS NOT NULL THEN
    IF p_session_id IS NULL OR v_cart.session_id <> p_session_id THEN
      RAISE EXCEPTION 'Cart does not belong to this session';
    END IF;
  ELSE
    RAISE EXCEPTION 'Cart has no owner';
  END IF;

  -- 3. First pass: validate stock for ALL items before any mutation
  FOR v_item IN
    SELECT
      ci.id            AS ci_id,
      ci.customised_product_id,
      ci.quantity,
      cp.quantity_stock,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price          AS base_price,
      p.name           AS product_name
    FROM cart_items ci
    JOIN customised_products cp
      ON cp.id = ci.customised_product_id
    JOIN products p
      ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
     
  LOOP
    v_item_count := v_item_count + 1;

    IF v_item.quantity > v_item.quantity_stock THEN
      RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %',
        v_item.product_name, v_item.quantity, v_item.quantity_stock;
    END IF;

    v_price := COALESCE(v_item.price_override, v_item.base_price);
    v_subtotal := v_subtotal + (v_price * v_item.quantity);
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- 4. Calculate total
  v_total := v_subtotal + COALESCE(p_shipping_fee, 0) - COALESCE(p_discount, 0);
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  -- 5. Create order
  INSERT INTO orders (
    user_id, session_id, status,
    subtotal, shipping_fee, discount, total,
    payment_status,
    address_snapshot, phone, email
  )
  VALUES (
    p_user_id, p_session_id, 'pending',
    v_subtotal, COALESCE(p_shipping_fee, 0), COALESCE(p_discount, 0), v_total,
    'pending',
    p_address_snapshot, p_phone, p_email
  )
  RETURNING id INTO v_order_id;

  -- 6. Second pass: create order_items (snapshots) + decrement stock
  FOR v_item IN
    SELECT
      ci.id            AS ci_id,
      ci.customised_product_id,
      ci.quantity,
      cp.quantity_stock,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price          AS base_price,
      p.name           AS product_name
    FROM cart_items ci
    JOIN customised_products cp
      ON cp.id = ci.customised_product_id
    JOIN products p
      ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
     
  LOOP
    v_price := COALESCE(v_item.price_override, v_item.base_price);

    INSERT INTO order_items (
      order_id, customised_product_id, quantity,
      price_snapshot, product_name_snapshot,
      size_snapshot, material_snapshot, color_snapshot
    )
    VALUES (
      v_order_id, v_item.customised_product_id, v_item.quantity,
      v_price, v_item.product_name,
      v_item.size, v_item.material, v_item.color
    );

    UPDATE customised_products
    SET quantity_stock = quantity_stock - v_item.quantity
    WHERE id = v_item.customised_product_id
      AND quantity_stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock race condition for "%": stock changed since validation',
        v_item.product_name;
    END IF;
  END LOOP;

  -- 7. Hard-delete cart (cart_items CASCADE)
  DELETE FROM carts
  WHERE id = p_cart_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb) TO service_role;

--------------------------------------------------
-- REVOKE upsert_cart_item FROM anon
--------------------------------------------------

REVOKE ALL ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO service_role;

NOTIFY pgrst, 'reload schema';




-- ============================================================
-- Source: 20260712110000_rls_policies_payments_shipping_promo_stats.sql
-- ============================================================

--------------------------------------------------
-- RLS policies for tables that had RLS enabled
-- but no policies (deny-all for session clients).
--
-- Tables: payments, shipments, shipping_zones,
--         shipping_fees, promo_codes, product_stats
--------------------------------------------------

--------------------------------------------------
-- PAYMENTS
--------------------------------------------------
drop policy if exists "Users can read own payments" on payments;
create policy "Users can read own payments"
on payments
for select
to authenticated
using (
  exists (
    select 1
    from orders o
    where o.id = payments.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Admins can manage payments" on payments;
create policy "Admins can manage payments"
on payments
for all
to authenticated
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- SHIPMENTS
--------------------------------------------------
drop policy if exists "Users can read own shipments" on shipments;
create policy "Users can read own shipments"
on shipments
for select
to authenticated
using (
  exists (
    select 1
    from orders o
    where o.id = shipments.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Admins can manage shipments" on shipments;
create policy "Admins can manage shipments"
on shipments
for all
to authenticated
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- SHIPPING ZONES (public read for checkout)
--------------------------------------------------
drop policy if exists "Public can read shipping zones" on shipping_zones;
create policy "Public can read shipping zones"
on shipping_zones
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage shipping zones" on shipping_zones;
create policy "Admins can manage shipping zones"
on shipping_zones
for all
to authenticated
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- SHIPPING FEES (public read for checkout)
--------------------------------------------------
drop policy if exists "Public can read shipping fees" on shipping_fees;
create policy "Public can read shipping fees"
on shipping_fees
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage shipping fees" on shipping_fees;
create policy "Admins can manage shipping fees"
on shipping_fees
for all
to authenticated
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- PROMO CODES (admin only Ã¢â‚¬â€ no public read)
--------------------------------------------------
drop policy if exists "Admins can manage promo codes" on promo_codes;
create policy "Admins can manage promo codes"
on promo_codes
for all
to authenticated
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- PRODUCT STATS (admin only; increments via service role)
--------------------------------------------------
drop policy if exists "Admins can manage product stats" on product_stats;
create policy "Admins can manage product stats"
on product_stats
for all
to authenticated
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);




-- ============================================================
-- Source: 20260712110001_contact_leads_rate_limit.sql
-- ============================================================

--------------------------------------------------
-- Close open public INSERT on contact_us / leads
-- and add DB-backed form rate-limit counters.
--------------------------------------------------

-- Drop public insert policies (WITH CHECK true was spam-open via anon key)
drop policy if exists "Public can submit contact form" on contact_us;
drop policy if exists "Public can insert leads" on leads;

-- Rate-limit counters (service-role only; RLS on, no policies)
create table if not exists public.form_rate_limits (
  key text primary key,
  window_started_at timestamptz not null default now(),
  hit_count int not null default 0
);

alter table public.form_rate_limits enable row level security;




-- ============================================================
-- Source: 20260712200000_lock_get_user_role_search_path.sql
-- ============================================================

--------------------------------------------------
-- Lock search_path on get_user_role()
--
-- SECURITY DEFINER helpers must pin search_path to avoid
-- search_path hijacking / object shadowing attacks.
--------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS profile_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role profile_role;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  RETURN coalesce(user_role, 'user'::profile_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;




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

-- 3. Cart items unique index (full, not partial)
DROP INDEX IF EXISTS cart_items_unique_active;
DROP INDEX IF EXISTS cart_items_unique_cart_variant;
CREATE UNIQUE INDEX cart_items_unique_cart_variant
ON cart_items (cart_id, customised_product_id);

-- 4. Drop policies that still reference deleted_at (must happen BEFORE DROP COLUMN)
DROP POLICY IF EXISTS "Public can read categories" ON categories;
DROP POLICY IF EXISTS "Public can read product variants" ON customised_products;
DROP POLICY IF EXISTS "Users can read reviews" ON reviews;

DROP POLICY IF EXISTS "Users can read own carts" ON carts;
DROP POLICY IF EXISTS "Users can insert own carts" ON carts;
DROP POLICY IF EXISTS "Users can update own carts" ON carts;
DROP POLICY IF EXISTS "Users can delete own carts" ON carts;

DROP POLICY IF EXISTS "Users can read own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;

DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
DROP POLICY IF EXISTS "Users can update own order items" ON order_items;
DROP POLICY IF EXISTS "Users can delete own order items" ON order_items;

DROP POLICY IF EXISTS "Users and guests can read wishlist items" ON wishlists;
DROP POLICY IF EXISTS "Users and guests can insert wishlist items" ON wishlists;
DROP POLICY IF EXISTS "Users and guests can delete wishlist items" ON wishlists;
DROP POLICY IF EXISTS "Users can view own wishlist items" ON wishlists;
DROP POLICY IF EXISTS "Users can insert own wishlist items" ON wishlists;
DROP POLICY IF EXISTS "Users can delete own wishlist items" ON wishlists;
DROP POLICY IF EXISTS "Users can read own wishlist items" ON wishlists;

DROP POLICY IF EXISTS "Users can read own payments" ON payments;
DROP POLICY IF EXISTS "Users can read own shipments" ON shipments;

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

-- 5. Recreate get_admin_profiles with is_active
-- Must DROP first: CREATE OR REPLACE cannot change RETURNS TABLE shape
DROP FUNCTION IF EXISTS public.get_admin_profiles();
CREATE OR REPLACE FUNCTION public.get_admin_profiles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  role profile_role,
  created_at timestamptz,
  is_active boolean,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_user_role() != 'admin'::profile_role THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.full_name,
    p.role,
    p.created_at,
    p.is_active,
    u.email::text
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_profiles() TO authenticated;

-- 6. Recreate upsert_cart_item without deleted_at
-- DROP first: SETOF cart_items shape changed after column drop
DROP FUNCTION IF EXISTS public.upsert_cart_item(uuid, uuid, integer);
CREATE OR REPLACE FUNCTION public.upsert_cart_item(
  p_cart_id uuid,
  p_customised_product_id uuid,
  p_quantity integer
)
RETURNS SETOF cart_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available_stock integer;
  v_result RECORD;
BEGIN
  SELECT quantity_stock INTO v_available_stock
  FROM customised_products
  WHERE id = p_customised_product_id;

  IF v_available_stock IS NULL THEN
    RAISE EXCEPTION 'Product variant not found';
  END IF;

  IF v_available_stock <= 0 THEN
    RAISE EXCEPTION 'Product variant is out of stock';
  END IF;

  UPDATE cart_items
  SET quantity = quantity + p_quantity
  WHERE cart_id = p_cart_id
    AND customised_product_id = p_customised_product_id
  RETURNING * INTO v_result;

  IF NOT FOUND THEN
    IF p_quantity > v_available_stock THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %',
        v_available_stock, p_quantity;
    END IF;

    INSERT INTO cart_items (cart_id, customised_product_id, quantity)
    VALUES (p_cart_id, p_customised_product_id, p_quantity)
    RETURNING * INTO v_result;
  ELSE
    IF v_result.quantity > v_available_stock THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %',
        v_available_stock, v_result.quantity;
    END IF;
  END IF;

  RETURN QUERY
  SELECT *
  FROM cart_items
  WHERE id = v_result.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) TO service_role;
REVOKE ALL ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_cart_item(uuid, uuid, integer) FROM anon;

-- 7. process_checkout: hard-delete cart (preserve ownership checks from prior migration)
CREATE OR REPLACE FUNCTION public.process_checkout(
  p_cart_id       uuid,
  p_user_id       uuid       DEFAULT NULL,
  p_session_id    text       DEFAULT NULL,
  p_shipping_fee  numeric    DEFAULT 0,
  p_discount      numeric    DEFAULT 0,
  p_phone         text       DEFAULT NULL,
  p_email         text       DEFAULT NULL,
  p_address_snapshot jsonb   DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart           RECORD;
  v_item           RECORD;
  v_subtotal       numeric := 0;
  v_total          numeric;
  v_order_id       uuid;
  v_price          numeric;
  v_item_count     integer := 0;
BEGIN
  SELECT * INTO v_cart
  FROM carts
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  IF v_cart.user_id IS NOT NULL THEN
    IF p_user_id IS NULL OR v_cart.user_id <> p_user_id THEN
      RAISE EXCEPTION 'Cart does not belong to this user';
    END IF;
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'Cart does not belong to this user';
    END IF;
  ELSIF v_cart.session_id IS NOT NULL THEN
    IF p_session_id IS NULL OR v_cart.session_id <> p_session_id THEN
      RAISE EXCEPTION 'Cart does not belong to this session';
    END IF;
  ELSE
    RAISE EXCEPTION 'Cart has no owner';
  END IF;

  FOR v_item IN
    SELECT
      ci.id            AS ci_id,
      ci.customised_product_id,
      ci.quantity,
      cp.quantity_stock,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price          AS base_price,
      p.name           AS product_name
    FROM cart_items ci
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
  LOOP
    v_item_count := v_item_count + 1;

    IF v_item.quantity > v_item.quantity_stock THEN
      RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %',
        v_item.product_name, v_item.quantity, v_item.quantity_stock;
    END IF;

    v_price := COALESCE(v_item.price_override, v_item.base_price);
    v_subtotal := v_subtotal + (v_price * v_item.quantity);
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  v_total := v_subtotal + COALESCE(p_shipping_fee, 0) - COALESCE(p_discount, 0);
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  INSERT INTO orders (
    user_id, session_id, status,
    subtotal, shipping_fee, discount, total,
    payment_status,
    address_snapshot, phone, email
  )
  VALUES (
    p_user_id, p_session_id, 'pending',
    v_subtotal, COALESCE(p_shipping_fee, 0), COALESCE(p_discount, 0), v_total,
    'pending',
    p_address_snapshot, p_phone, p_email
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN
    SELECT
      ci.customised_product_id,
      ci.quantity,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price AS base_price,
      p.name AS product_name
    FROM cart_items ci
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
  LOOP
    v_price := COALESCE(v_item.price_override, v_item.base_price);

    INSERT INTO order_items (
      order_id, customised_product_id, quantity,
      price_snapshot, product_name_snapshot,
      size_snapshot, material_snapshot, color_snapshot
    )
    VALUES (
      v_order_id, v_item.customised_product_id, v_item.quantity,
      v_price, v_item.product_name,
      v_item.size, v_item.material, v_item.color
    );

    UPDATE customised_products
    SET quantity_stock = quantity_stock - v_item.quantity
    WHERE id = v_item.customised_product_id
      AND quantity_stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock race condition for "%": stock changed since validation',
        v_item.product_name;
    END IF;
  END LOOP;

  DELETE FROM carts WHERE id = p_cart_id;

  RETURN v_order_id;
END;
$$;

-- 8. Recreate RLS policies without deleted_at
CREATE POLICY "Public can read categories"
ON categories FOR SELECT
USING (true);

CREATE POLICY "Public can read product variants"
ON customised_products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = customised_products.product_id
      AND products.is_active = true
  )
);

CREATE POLICY "Users can read reviews"
ON reviews FOR SELECT
USING (
  review_status = 'approved'
  OR auth.uid() = user_id
);

CREATE POLICY "Users can read own carts"
ON carts FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own carts"
ON carts FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own carts"
ON carts FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own carts"
ON carts FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Users can read own cart items"
ON cart_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM carts c
    WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own cart items"
ON cart_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM carts c
    WHERE c.id = cart_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own cart items"
ON cart_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM carts c
    WHERE c.id = cart_id AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM carts c
    WHERE c.id = cart_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own cart items"
ON cart_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM carts c
    WHERE c.id = cart_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own orders"
ON orders FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own orders"
ON orders FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own orders"
ON orders FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Users can read own order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own order items"
ON order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own order items"
ON order_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own order items"
ON order_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own wishlist items"
ON wishlists FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wishlist items"
ON wishlists FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own wishlist items"
ON wishlists FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Users can read own payments"
ON payments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = payments.order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own shipments"
ON shipments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = shipments.order_id AND o.user_id = auth.uid()
  )
);

NOTIFY pgrst, 'reload schema';




-- ============================================================
-- Source: 20260712220000_restore_product_image_policies.sql
-- ============================================================

--------------------------------------------------
-- Ensure product image storage + table policies
-- after soft-delete CASCADE may have dropped
-- policies that referenced products.deleted_at.
--------------------------------------------------

-- Public storefront product read (if CASCADE dropped it)
DROP POLICY IF EXISTS "Public can read active products" ON products;
CREATE POLICY "Public can read active products"
ON products FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Public can read product images" ON product_images;
CREATE POLICY "Public can read product images"
ON product_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_images.product_id
      AND products.is_active = true
  )
);

-- Admin table CRUD (idempotent)
DROP POLICY IF EXISTS "Admins can manage product_images" ON product_images;
CREATE POLICY "Admins can manage product_images"
ON product_images FOR ALL
USING (public.get_user_role() = 'admin'::profile_role)
WITH CHECK (public.get_user_role() = 'admin'::profile_role);

-- Storage: admin upload / delete / update; public read
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
  AND public.get_user_role() = 'admin'::profile_role
);

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
  AND public.get_user_role() = 'admin'::profile_role
);

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
  AND public.get_user_role() = 'admin'::profile_role
);

DROP POLICY IF EXISTS "Public can read product storage" ON storage.objects;
CREATE POLICY "Public can read product storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

NOTIFY pgrst, 'reload schema';




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




-- ============================================================
-- Source: 20260713130000_process_checkout_resolve_shipping.sql
-- ============================================================

-- Harden process_checkout: resolve shipping fee from zone id inside SQL.
-- Remove trusted p_shipping_fee / p_discount money args; force discount = 0
-- until promo codes are wired into checkout.

DROP FUNCTION IF EXISTS public.process_checkout(uuid, uuid, text, numeric, numeric, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_cart_id            uuid,
  p_shipping_zone_id   uuid,
  p_user_id            uuid       DEFAULT NULL,
  p_session_id         text       DEFAULT NULL,
  p_phone              text       DEFAULT NULL,
  p_email              text       DEFAULT NULL,
  p_address_snapshot   jsonb      DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart           RECORD;
  v_item           RECORD;
  v_subtotal       numeric := 0;
  v_shipping_fee   numeric := 0;
  v_discount       numeric := 0;
  v_total          numeric;
  v_order_id       uuid;
  v_price          numeric;
  v_item_count     integer := 0;
BEGIN
  SELECT * INTO v_cart
  FROM carts
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  IF v_cart.user_id IS NOT NULL THEN
    IF p_user_id IS NULL OR v_cart.user_id <> p_user_id THEN
      RAISE EXCEPTION 'Cart does not belong to this user';
    END IF;
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'Cart does not belong to this user';
    END IF;
  ELSIF v_cart.session_id IS NOT NULL THEN
    IF p_session_id IS NULL OR v_cart.session_id <> p_session_id THEN
      RAISE EXCEPTION 'Cart does not belong to this session';
    END IF;
  ELSE
    RAISE EXCEPTION 'Cart has no owner';
  END IF;

  FOR v_item IN
    SELECT
      ci.id            AS ci_id,
      ci.customised_product_id,
      ci.quantity,
      cp.quantity_stock,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price          AS base_price,
      p.name           AS product_name
    FROM cart_items ci
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
  LOOP
    v_item_count := v_item_count + 1;

    IF v_item.quantity > v_item.quantity_stock THEN
      RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %',
        v_item.product_name, v_item.quantity, v_item.quantity_stock;
    END IF;

    v_price := COALESCE(v_item.price_override, v_item.base_price);
    v_subtotal := v_subtotal + (v_price * v_item.quantity);
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Resolve shipping fee from zone (first fee row by created_at ASC)
  SELECT COALESCE(sf.fee, 0)
  INTO v_shipping_fee
  FROM shipping_zones sz
  LEFT JOIN LATERAL (
    SELECT fee
    FROM shipping_fees
    WHERE zone_id = sz.id
    ORDER BY created_at ASC
    LIMIT 1
  ) sf ON true
  WHERE sz.id = p_shipping_zone_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid shipping zone';
  END IF;

  -- Promo codes not wired into checkout yet
  v_discount := 0;

  v_total := v_subtotal + v_shipping_fee - v_discount;
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  INSERT INTO orders (
    user_id, session_id, status,
    subtotal, shipping_fee, discount, total,
    payment_status,
    address_snapshot, phone, email
  )
  VALUES (
    p_user_id, p_session_id, 'pending',
    v_subtotal, v_shipping_fee, v_discount, v_total,
    'pending',
    p_address_snapshot, p_phone, p_email
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN
    SELECT
      ci.customised_product_id,
      ci.quantity,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price AS base_price,
      p.name AS product_name
    FROM cart_items ci
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
  LOOP
    v_price := COALESCE(v_item.price_override, v_item.base_price);

    INSERT INTO order_items (
      order_id, customised_product_id, quantity,
      price_snapshot, product_name_snapshot,
      size_snapshot, material_snapshot, color_snapshot
    )
    VALUES (
      v_order_id, v_item.customised_product_id, v_item.quantity,
      v_price, v_item.product_name,
      v_item.size, v_item.material, v_item.color
    );

    UPDATE customised_products
    SET quantity_stock = quantity_stock - v_item.quantity
    WHERE id = v_item.customised_product_id
      AND quantity_stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock race condition for "%": stock changed since validation',
        v_item.product_name;
    END IF;
  END LOOP;

  DELETE FROM carts WHERE id = p_cart_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb) TO service_role;




-- ============================================================
-- Source: 20260713140000_checkout_payments_and_promos.sql
-- ============================================================

-- Checkout: pending payments row + promo codes at place-order.
-- Extends process_checkout (zone-resolved shipping) with optional p_promo_code,
-- inserts payments(status=pending), stores orders.promo_code_id, bumps use_count.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS promo_code_id uuid
  REFERENCES public.promo_codes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_promo_code_id ON public.orders(promo_code_id);

DROP FUNCTION IF EXISTS public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_cart_id            uuid,
  p_shipping_zone_id   uuid,
  p_user_id            uuid       DEFAULT NULL,
  p_session_id         text       DEFAULT NULL,
  p_phone              text       DEFAULT NULL,
  p_email              text       DEFAULT NULL,
  p_address_snapshot   jsonb      DEFAULT NULL,
  p_promo_code         text       DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart           RECORD;
  v_item           RECORD;
  v_promo          RECORD;
  v_subtotal       numeric := 0;
  v_shipping_fee   numeric := 0;
  v_discount       numeric := 0;
  v_promo_id       uuid := NULL;
  v_total          numeric;
  v_order_id       uuid;
  v_price          numeric;
  v_item_count     integer := 0;
  v_code           text;
BEGIN
  SELECT * INTO v_cart
  FROM carts
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  IF v_cart.user_id IS NOT NULL THEN
    IF p_user_id IS NULL OR v_cart.user_id <> p_user_id THEN
      RAISE EXCEPTION 'Cart does not belong to this user';
    END IF;
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'Cart does not belong to this user';
    END IF;
  ELSIF v_cart.session_id IS NOT NULL THEN
    IF p_session_id IS NULL OR v_cart.session_id <> p_session_id THEN
      RAISE EXCEPTION 'Cart does not belong to this session';
    END IF;
  ELSE
    RAISE EXCEPTION 'Cart has no owner';
  END IF;

  FOR v_item IN
    SELECT
      ci.id            AS ci_id,
      ci.customised_product_id,
      ci.quantity,
      cp.quantity_stock,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price          AS base_price,
      p.name           AS product_name
    FROM cart_items ci
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
  LOOP
    v_item_count := v_item_count + 1;

    IF v_item.quantity > v_item.quantity_stock THEN
      RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %',
        v_item.product_name, v_item.quantity, v_item.quantity_stock;
    END IF;

    v_price := COALESCE(v_item.price_override, v_item.base_price);
    v_subtotal := v_subtotal + (v_price * v_item.quantity);
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Resolve shipping fee from zone (first fee row by created_at ASC)
  SELECT COALESCE(sf.fee, 0)
  INTO v_shipping_fee
  FROM shipping_zones sz
  LEFT JOIN LATERAL (
    SELECT fee
    FROM shipping_fees
    WHERE zone_id = sz.id
    ORDER BY created_at ASC
    LIMIT 1
  ) sf ON true
  WHERE sz.id = p_shipping_zone_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid shipping zone';
  END IF;

  -- Optional promo: validate + compute discount server-side (never trust client money)
  v_code := NULLIF(upper(trim(COALESCE(p_promo_code, ''))), '');
  IF v_code IS NOT NULL THEN
    SELECT *
    INTO v_promo
    FROM promo_codes
    WHERE code = v_code
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid promo code';
    END IF;

    IF v_promo.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Promo code is inactive';
    END IF;

    IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at <= now() THEN
      RAISE EXCEPTION 'Promo code has expired';
    END IF;

    IF v_promo.max_uses IS NOT NULL AND v_promo.use_count >= v_promo.max_uses THEN
      RAISE EXCEPTION 'Promo code has reached its usage limit';
    END IF;

    IF v_promo.discount_type = 'percentage' THEN
      v_discount := round(v_subtotal * COALESCE(v_promo.discount_value, 0) / 100.0, 2);
    ELSE
      -- fixed
      v_discount := LEAST(COALESCE(v_promo.discount_value, 0), v_subtotal);
    END IF;

    IF v_discount < 0 THEN
      v_discount := 0;
    END IF;

    v_promo_id := v_promo.id;
  END IF;

  v_total := v_subtotal + v_shipping_fee - v_discount;
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  INSERT INTO orders (
    user_id, session_id, status,
    subtotal, shipping_fee, discount, total,
    payment_status,
    address_snapshot, phone, email,
    promo_code_id
  )
  VALUES (
    p_user_id, p_session_id, 'pending',
    v_subtotal, v_shipping_fee, v_discount, v_total,
    'pending',
    p_address_snapshot, p_phone, p_email,
    v_promo_id
  )
  RETURNING id INTO v_order_id;

  IF v_promo_id IS NOT NULL THEN
    UPDATE promo_codes
    SET use_count = use_count + 1
    WHERE id = v_promo_id;
  END IF;

  FOR v_item IN
    SELECT
      ci.customised_product_id,
      ci.quantity,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price AS base_price,
      p.name AS product_name
    FROM cart_items ci
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
  LOOP
    v_price := COALESCE(v_item.price_override, v_item.base_price);

    INSERT INTO order_items (
      order_id, customised_product_id, quantity,
      price_snapshot, product_name_snapshot,
      size_snapshot, material_snapshot, color_snapshot
    )
    VALUES (
      v_order_id, v_item.customised_product_id, v_item.quantity,
      v_price, v_item.product_name,
      v_item.size, v_item.material, v_item.color
    );

    UPDATE customised_products
    SET quantity_stock = quantity_stock - v_item.quantity
    WHERE id = v_item.customised_product_id
      AND quantity_stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock race condition for "%": stock changed since validation',
        v_item.product_name;
    END IF;
  END LOOP;

  -- Dual source of truth: always create a pending payments row with order total
  INSERT INTO payments (
    order_id,
    status,
    amount,
    currency
  )
  VALUES (
    v_order_id,
    'pending',
    v_total,
    'USD'
  );

  DELETE FROM carts WHERE id = p_cart_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) FROM anon;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) TO service_role;




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

COMMENT ON COLUMN public.orders.shipping_zone_id IS
  'Shipping zone selected at checkout; SET NULL if zone is deleted.';

COMMENT ON COLUMN public.orders.shipping_zone_name IS
  'Immutable zone name snapshot at checkout (survives zone rename/delete).';

-- Replace process_checkout (latest signature includes optional p_promo_code)
DROP FUNCTION IF EXISTS public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text);

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_cart_id            uuid,
  p_shipping_zone_id   uuid,
  p_user_id            uuid       DEFAULT NULL,
  p_session_id         text       DEFAULT NULL,
  p_phone              text       DEFAULT NULL,
  p_email              text       DEFAULT NULL,
  p_address_snapshot   jsonb      DEFAULT NULL,
  p_promo_code         text       DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart           RECORD;
  v_item           RECORD;
  v_promo          RECORD;
  v_subtotal       numeric := 0;
  v_shipping_fee   numeric := 0;
  v_zone_name      text := NULL;
  v_discount       numeric := 0;
  v_promo_id       uuid := NULL;
  v_total          numeric;
  v_order_id       uuid;
  v_price          numeric;
  v_item_count     integer := 0;
  v_code           text;
BEGIN
  SELECT * INTO v_cart
  FROM carts
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  IF v_cart.user_id IS NOT NULL THEN
    IF p_user_id IS NULL OR v_cart.user_id <> p_user_id THEN
      RAISE EXCEPTION 'Cart does not belong to this user';
    END IF;
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'Cart does not belong to this user';
    END IF;
  ELSIF v_cart.session_id IS NOT NULL THEN
    IF p_session_id IS NULL OR v_cart.session_id <> p_session_id THEN
      RAISE EXCEPTION 'Cart does not belong to this session';
    END IF;
  ELSE
    RAISE EXCEPTION 'Cart has no owner';
  END IF;

  FOR v_item IN
    SELECT
      ci.id            AS ci_id,
      ci.customised_product_id,
      ci.quantity,
      cp.quantity_stock,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price          AS base_price,
      p.name           AS product_name
    FROM cart_items ci
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
  LOOP
    v_item_count := v_item_count + 1;

    IF v_item.quantity > v_item.quantity_stock THEN
      RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %',
        v_item.product_name, v_item.quantity, v_item.quantity_stock;
    END IF;

    v_price := COALESCE(v_item.price_override, v_item.base_price);
    v_subtotal := v_subtotal + (v_price * v_item.quantity);
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Resolve shipping fee + zone name from zone (first fee row by created_at ASC)
  SELECT COALESCE(sf.fee, 0), sz.name
  INTO v_shipping_fee, v_zone_name
  FROM shipping_zones sz
  LEFT JOIN LATERAL (
    SELECT fee
    FROM shipping_fees
    WHERE zone_id = sz.id
    ORDER BY created_at ASC
    LIMIT 1
  ) sf ON true
  WHERE sz.id = p_shipping_zone_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid shipping zone';
  END IF;

  -- Optional promo: validate + compute discount server-side (never trust client money)
  v_code := NULLIF(upper(trim(COALESCE(p_promo_code, ''))), '');
  IF v_code IS NOT NULL THEN
    SELECT *
    INTO v_promo
    FROM promo_codes
    WHERE code = v_code
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid promo code';
    END IF;

    IF v_promo.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Promo code is inactive';
    END IF;

    IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at <= now() THEN
      RAISE EXCEPTION 'Promo code has expired';
    END IF;

    IF v_promo.max_uses IS NOT NULL AND v_promo.use_count >= v_promo.max_uses THEN
      RAISE EXCEPTION 'Promo code has reached its usage limit';
    END IF;

    IF v_promo.discount_type = 'percentage' THEN
      v_discount := round(v_subtotal * COALESCE(v_promo.discount_value, 0) / 100.0, 2);
    ELSE
      -- fixed
      v_discount := LEAST(COALESCE(v_promo.discount_value, 0), v_subtotal);
    END IF;

    IF v_discount < 0 THEN
      v_discount := 0;
    END IF;

    v_promo_id := v_promo.id;
  END IF;

  v_total := v_subtotal + v_shipping_fee - v_discount;
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  INSERT INTO orders (
    user_id, session_id, status,
    subtotal, shipping_fee, discount, total,
    payment_status,
    address_snapshot, phone, email,
    promo_code_id,
    shipping_zone_id, shipping_zone_name
  )
  VALUES (
    p_user_id, p_session_id, 'pending',
    v_subtotal, v_shipping_fee, v_discount, v_total,
    'pending',
    p_address_snapshot, p_phone, p_email,
    v_promo_id,
    p_shipping_zone_id, v_zone_name
  )
  RETURNING id INTO v_order_id;

  IF v_promo_id IS NOT NULL THEN
    UPDATE promo_codes
    SET use_count = use_count + 1
    WHERE id = v_promo_id;
  END IF;

  FOR v_item IN
    SELECT
      ci.customised_product_id,
      ci.quantity,
      cp.color,
      cp.size,
      cp.material,
      cp.price_override,
      p.price AS base_price,
      p.name AS product_name
    FROM cart_items ci
    JOIN customised_products cp ON cp.id = ci.customised_product_id
    JOIN products p ON p.id = cp.product_id
    WHERE ci.cart_id = p_cart_id
  LOOP
    v_price := COALESCE(v_item.price_override, v_item.base_price);

    INSERT INTO order_items (
      order_id, customised_product_id, quantity,
      price_snapshot, product_name_snapshot,
      size_snapshot, material_snapshot, color_snapshot
    )
    VALUES (
      v_order_id, v_item.customised_product_id, v_item.quantity,
      v_price, v_item.product_name,
      v_item.size, v_item.material, v_item.color
    );

    UPDATE customised_products
    SET quantity_stock = quantity_stock - v_item.quantity
    WHERE id = v_item.customised_product_id
      AND quantity_stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock race condition for "%": stock changed since validation',
        v_item.product_name;
    END IF;
  END LOOP;

  -- Dual source of truth: always create a pending payments row with order total
  INSERT INTO payments (
    order_id,
    status,
    amount,
    currency
  )
  VALUES (
    v_order_id,
    'pending',
    v_total,
    'USD'
  );

  DELETE FROM carts WHERE id = p_cart_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) FROM anon;
REVOKE ALL ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, uuid, uuid, text, text, text, jsonb, text) TO service_role;




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


-- ============================================================
-- Source: 20260714190000_public_read_brands.sql
-- ============================================================

-- Allow anon / authenticated guests to read brands (product embed brand:brands(*)).
-- Admin CRUD remains via "Admins can manage brands".

DROP POLICY IF EXISTS "Public can read brands" ON brands;
CREATE POLICY "Public can read brands"
ON brands
FOR SELECT
USING (true);


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

-- Base price change: recompute from variants (does not touch price â†’ no recursion)
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


-- ============================================================
-- Source: 20260714210000_public_read_product_stats.sql
-- ============================================================

-- Allow anon / authenticated guests to read product_stats aggregates (PDP views / ATC / purchases).
-- Writes remain admin / service-role only via "Admins can manage product stats".

DROP POLICY IF EXISTS "Public can read product stats" ON product_stats;
CREATE POLICY "Public can read product stats"
ON product_stats
FOR SELECT
USING (true);


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

---------------------------------------------------
-- 2. Partial unique index: one guest cart per session
---------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS carts_unique_guest_session
ON carts (session_id)
WHERE user_id IS NULL AND session_id IS NOT NULL;


-- ============================================================
-- Source: 20260719150000_check_form_rate_limit.sql
-- ============================================================

-- Atomic form rate-limit check for contact/lead public actions.
-- Replaces non-atomic read â†’ decide â†’ write (TOCTOU) and enables fail-closed TS.

CREATE OR REPLACE FUNCTION public.check_form_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.form_rate_limits%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  IF p_key IS NULL OR length(trim(p_key)) = 0 THEN
    RAISE EXCEPTION 'p_key is required';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'p_limit must be >= 1';
  END IF;
  IF p_window_seconds IS NULL OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'p_window_seconds must be >= 1';
  END IF;

  -- Lock existing row if present
  SELECT * INTO v_row
  FROM public.form_rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    BEGIN
      INSERT INTO public.form_rate_limits (key, window_started_at, hit_count)
      VALUES (p_key, v_now, 1);
      RETURN true;
    EXCEPTION
      WHEN unique_violation THEN
        -- Concurrent first insert: lock winner and continue
        SELECT * INTO v_row
        FROM public.form_rate_limits
        WHERE key = p_key
        FOR UPDATE;
    END;
  END IF;

  IF v_now - v_row.window_started_at >= make_interval(secs => p_window_seconds) THEN
    UPDATE public.form_rate_limits
    SET window_started_at = v_now,
        hit_count = 1
    WHERE key = p_key;
    RETURN true;
  END IF;

  IF v_row.hit_count >= p_limit THEN
    RETURN false;
  END IF;

  UPDATE public.form_rate_limits
  SET hit_count = hit_count + 1
  WHERE key = p_key;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_form_rate_limit(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_form_rate_limit(text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.check_form_rate_limit(text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_form_rate_limit(text, integer, integer) TO service_role;

NOTIFY pgrst, 'reload schema';


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

---------------------------------------------------
-- 3. Unique index + drop obsolete non-unique index
---------------------------------------------------

DROP INDEX IF EXISTS idx_leads_email;

CREATE UNIQUE INDEX leads_email_normalized_uidx
  ON leads (lower(trim(email)));


-- ============================================================
-- Source: 20260719152000_leads_user_id.sql
-- ============================================================

-- Link newsletter leads to auth users when subscribed while logged in.
-- Nullable: guests remain user_id null; ON DELETE SET NULL if account removed.

alter table public.leads
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_leads_user_id on public.leads (user_id);


-- ============================================================
-- Source: 20260719160000_leads_status_unsubscribe.sql
-- ============================================================

-- Lead consent / unsubscribe fields for marketing list hygiene.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid;

-- Backfill existing rows before NOT NULL / defaults
UPDATE public.leads
SET
  status = COALESCE(status, 'subscribed'),
  source = COALESCE(source, 'footer'),
  unsubscribe_token = COALESCE(unsubscribe_token, gen_random_uuid())
WHERE status IS NULL
   OR source IS NULL
   OR unsubscribe_token IS NULL;

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

CREATE UNIQUE INDEX IF NOT EXISTS leads_unsubscribe_token_uidx
  ON public.leads (unsubscribe_token);


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

---------------------------------------------------
-- 3. Unique indexes
---------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_variant_uidx
  ON wishlists (user_id, customised_product_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS wishlists_session_variant_uidx
  ON wishlists (session_id, customised_product_id)
  WHERE user_id IS NULL AND session_id IS NOT NULL;


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

ALTER TABLE categories
  ALTER COLUMN slug SET NOT NULL;


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


-- ============================================================
-- Source: 20260720182000_restock_only_on_cancel.sql
-- ============================================================

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


-- ============================================================
-- Source: 20260720190000_get_admin_profiles_page.sql
-- ============================================================

-- Paginated admin profiles (avoids PostgREST max_rows silent truncation).

CREATE OR REPLACE FUNCTION public.get_admin_profiles_page(
  p_limit integer,
  p_offset integer,
  p_query text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  role profile_role,
  created_at timestamptz,
  is_active boolean,
  email text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer := GREATEST(1, LEAST(COALESCE(p_limit, 20), 100));
  v_offset integer := GREATEST(0, COALESCE(p_offset, 0));
  v_query text := NULLIF(TRIM(COALESCE(p_query, '')), '');
  v_role profile_role;
BEGIN
  IF public.get_user_role() != 'admin'::profile_role THEN
    RETURN;
  END IF;

  IF p_role IS NOT NULL AND TRIM(p_role) <> '' THEN
    BEGIN
      v_role := TRIM(p_role)::profile_role;
    EXCEPTION WHEN others THEN
      v_role := NULL;
    END;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.full_name,
    p.role,
    p.created_at,
    p.is_active,
    u.email::text,
    COUNT(*) OVER()::bigint AS total_count
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE
    (v_role IS NULL OR p.role = v_role)
    AND (p_is_active IS NULL OR p.is_active = p_is_active)
    AND (
      v_query IS NULL
      OR p.full_name ILIKE '%' || v_query || '%'
      OR u.email::text ILIKE '%' || v_query || '%'
    )
  ORDER BY p.created_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_profiles_page(
  integer,
  integer,
  text,
  text,
  boolean
) TO authenticated;


-- ============================================================
-- Source: 20260720193000_product_qa_public_rls.sql
-- ============================================================

-- Product Q&A public RLS (storefront ask + read approved)
-- Mirrors reviews policies: approved (or own) SELECT; auth INSERT pending; admin ALL.

--------------------------------------------------
-- product_questions
--------------------------------------------------

drop policy if exists "Users can read product questions" on product_questions;
create policy "Users can read product questions"
on product_questions
for select
using (
  is_approved = true
  or auth.uid() = user_id
);

drop policy if exists "Users can insert own product questions" on product_questions;
create policy "Users can insert own product questions"
on product_questions
for insert
with check (
  auth.uid() = user_id
  and is_approved = false
);

drop policy if exists "Admins can manage product questions" on product_questions;
create policy "Admins can manage product questions"
on product_questions
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- product_answers
--------------------------------------------------

drop policy if exists "Users can read product answers" on product_answers;
create policy "Users can read product answers"
on product_answers
for select
using (
  exists (
    select 1
    from product_questions pq
    where pq.id = product_answers.product_question_id
      and (
        pq.is_approved = true
        or auth.uid() = pq.user_id
      )
  )
);

drop policy if exists "Admins can manage product answers" on product_answers;
create policy "Admins can manage product answers"
on product_answers
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);


-- ============================================================
-- Source: 20260720195000_admin_top_products_by_product_id.sql
-- ============================================================

-- Aggregate top products by real product UUID (via customised_products), not name snapshot.
-- Return type changes â†’ DROP first.

DROP FUNCTION IF EXISTS public.admin_top_products_by_revenue(integer, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.admin_top_products_by_revenue(
  p_limit integer DEFAULT 10,
  p_from timestamptz DEFAULT NULL,
  p_to_exclusive timestamptz DEFAULT NULL
)
RETURNS TABLE (
  product_id text,
  product_name text,
  revenue numeric,
  order_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    keyed.product_id,
    MAX(keyed.product_name) AS product_name,
    ROUND(
      SUM(COALESCE(keyed.price_snapshot, 0) * COALESCE(keyed.quantity, 0))::numeric,
      2
    ) AS revenue,
    COUNT(DISTINCT keyed.order_id)::bigint AS order_count
  FROM (
    SELECT
      oi.order_id,
      oi.price_snapshot,
      oi.quantity,
      COALESCE(
        cp.product_id::text,
        'orphan:' || COALESCE(NULLIF(TRIM(oi.product_name_snapshot), ''), 'unknown')
      ) AS product_id,
      COALESCE(
        NULLIF(TRIM(p.name), ''),
        NULLIF(TRIM(oi.product_name_snapshot), ''),
        'Unknown Product'
      ) AS product_name
    FROM public.order_items oi
    INNER JOIN public.orders o ON o.id = oi.order_id
    LEFT JOIN public.customised_products cp ON cp.id = oi.customised_product_id
    LEFT JOIN public.products p ON p.id = cp.product_id
    WHERE o.status <> 'cancelled'
      AND (p_from IS NULL OR o.created_at >= p_from)
      AND (p_to_exclusive IS NULL OR o.created_at < p_to_exclusive)
  ) keyed
  GROUP BY keyed.product_id
  ORDER BY revenue DESC
  LIMIT GREATEST(COALESCE(p_limit, 10), 1);
$$;

REVOKE ALL ON FUNCTION public.admin_top_products_by_revenue(integer, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_top_products_by_revenue(integer, timestamptz, timestamptz) TO service_role;


-- ============================================================
-- Source: 20260720200000_admin_orders_revenue_sum.sql
-- ============================================================

-- Exact order revenue sum for Dashboard / Analytics.
-- PostgREST `total.sum()` is disabled on this project ("Use of aggregate functions is not allowed").
-- Excludes cancelled orders; optional created_at range (same rules as admin_top_products_by_revenue).

create or replace function public.admin_orders_revenue_sum(
  p_from timestamptz default null,
  p_to_exclusive timestamptz default null
)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    round(sum(o.total)::numeric, 2),
    0
  )
  from orders o
  where o.status <> 'cancelled'
    and (p_from is null or o.created_at >= p_from)
    and (p_to_exclusive is null or o.created_at < p_to_exclusive);
$$;

revoke all on function public.admin_orders_revenue_sum(timestamptz, timestamptz) from public;
grant execute on function public.admin_orders_revenue_sum(timestamptz, timestamptz) to service_role;


-- ============================================================
-- Source: 20260724120000_profiles_restrict_owner_updates.sql
-- ============================================================

-- Restrict owner self-updates on profiles to full_name only.
-- Extends prevent_role_change so owners cannot change role, is_active,
-- user_id, id, or created_at. Admins updating other users are unaffected.

CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.user_id = auth.uid() THEN
    IF OLD.role IS DISTINCT FROM NEW.role
       OR OLD.is_active IS DISTINCT FROM NEW.is_active
       OR OLD.user_id IS DISTINCT FROM NEW.user_id
       OR OLD.id IS DISTINCT FROM NEW.id
       OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
      RAISE EXCEPTION
        'Users can only update full_name on their own profile.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


-- ============================================================
-- Source: 20260724190000_set_default_user_address.sql
-- ============================================================

-- Atomic set-default for user_addresses.
-- Verifies ownership via auth.uid(), sets target default, then clears others.
-- Prevents clear-then-set leaving zero defaults when id is missing/foreign.

CREATE OR REPLACE FUNCTION public.set_default_user_address(p_address_id uuid)
RETURNS public.user_addresses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.user_addresses%ROWTYPE;
BEGIN
  IF p_address_id IS NULL THEN
    RAISE EXCEPTION 'Address id is required';
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.user_addresses
  SET is_default = true
  WHERE id = p_address_id
    AND user_id = auth.uid()
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Address not found';
  END IF;

  UPDATE public.user_addresses
  SET is_default = false
  WHERE user_id = auth.uid()
    AND id <> p_address_id
    AND is_default = true;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.set_default_user_address(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_default_user_address(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_default_user_address(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_default_user_address(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';

