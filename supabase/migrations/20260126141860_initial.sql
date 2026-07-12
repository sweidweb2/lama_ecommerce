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
  deleted_at timestamptz
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
  created_at timestamptz default now(),
  deleted_at timestamptz
);

--------------------------------------------------
-- BRAND
--------------------------------------------------
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_image_url text,
  created_at timestamptz default now(),
  deleted_at timestamptz
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
  created_at timestamptz default now(),
  deleted_at timestamptz
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
  updated_at timestamptz default now(),
  deleted_at timestamptz
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
  created_at timestamptz default now(),
  deleted_at timestamptz
);

--------------------------------------------------
-- WISHLIST
--------------------------------------------------
create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customised_product_id uuid not null references customised_products(id),
  created_at timestamptz default now(),
  deleted_at timestamptz
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
  deleted_at timestamptz,
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
  created_at timestamptz default now(),
  deleted_at timestamptz
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
  deleted_at timestamptz,
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
  updated_at timestamptz default now(),
  deleted_at timestamptz
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
  created_at timestamptz default now(),
  deleted_at timestamptz
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
  created_at timestamptz default now(),
  deleted_at timestamptz
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
  created_at timestamptz default now(),
  deleted_at timestamptz
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
-- - auth.uid() → current authenticated user ID
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
-- - Soft-delete: admins set deleted_at via UPDATE (no separate delete policy).
-- - get_admin_profiles(): returns profiles joined with auth.users email for admin only.
--------------------------------------------------

-- Admins can read all profiles
create policy "Admins can read all profiles"
on profiles
for select
using (public.get_user_role() = 'admin'::profile_role);

-- Admins can update any profile (e.g. full_name, role; soft-delete via deleted_at)
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
  deleted_at timestamptz,
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
    p.deleted_at,
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
  deleted_at is null
  and exists (
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
  deleted_at is null
  and (
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
  deleted_at is null
  and (
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
  deleted_at is null
  and (
    user_id = auth.uid()  -- Authenticated users: their own carts
    or (user_id is null)  -- Guests: carts with no user_id
  )
)
with check (
  deleted_at is null
  and (
    user_id = auth.uid()  -- Authenticated users: their own carts
    or (user_id is null)  -- Guests: carts with no user_id
  )
);

-- Users can delete their own carts (soft delete by setting deleted_at)
drop policy if exists "Users can delete own carts" on carts;
create policy "Users can delete own carts"
on carts
for delete
using (
  deleted_at is null
  and (
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
  deleted_at is null
  and exists (
    select 1
    from carts c
    where c.id = cart_items.cart_id
      and c.deleted_at is null
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
      and c.deleted_at is null
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
  deleted_at is null
  and exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.deleted_at is null
      and (
        c.user_id = auth.uid()  -- Authenticated users: their own carts
        or c.user_id is null    -- Guests: carts with no user_id
      )
  )
)
with check (
  deleted_at is null
  and exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.deleted_at is null
      and (
        c.user_id = auth.uid()  -- Authenticated users: their own carts
        or c.user_id is null    -- Guests: carts with no user_id
      )
  )
);

-- Users can delete cart items from their own carts (soft delete by setting deleted_at)
drop policy if exists "Users can delete own cart items" on cart_items;
create policy "Users can delete own cart items"
on cart_items
for delete
using (
  deleted_at is null
  and exists (
    select 1
    from carts c
    where c.id = cart_id
      and c.deleted_at is null
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
-- Prevents duplicate active cart items (ignores soft-deleted)
-- This index ensures only one active cart item per (cart_id, customised_product_id)
--------------------------------------------------
DROP INDEX IF EXISTS cart_items_unique_active;
CREATE UNIQUE INDEX cart_items_unique_active
ON cart_items (cart_id, customised_product_id)
WHERE deleted_at IS NULL;

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
  WHERE id = p_customised_product_id
    AND deleted_at IS NULL;
  
  IF v_available_stock IS NULL THEN
    RAISE EXCEPTION 'Product variant not found or deleted';
  END IF;
  
  IF v_available_stock <= 0 THEN
    RAISE EXCEPTION 'Product variant is out of stock';
  END IF;
  
  -- 2. Try to update existing cart item (if exists and not soft-deleted)
  UPDATE cart_items
  SET quantity = quantity + p_quantity
  WHERE cart_id = p_cart_id
    AND customised_product_id = p_customised_product_id
    AND deleted_at IS NULL
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
  deleted_at is null
  and (
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
  deleted_at is null
  and (
    user_id = auth.uid()      -- Authenticated users: their own orders
    or (user_id is null)      -- Guests: orders with no user_id
  )
)
with check (
  deleted_at is null
  and (
    user_id = auth.uid()      -- Authenticated users: their own orders
    or (user_id is null)      -- Guests: orders with no user_id
  )
);

-- Users can delete their own orders (soft delete by setting deleted_at)
drop policy if exists "Users can delete own orders" on orders;
create policy "Users can delete own orders"
on orders
for delete
using (
  deleted_at is null
  and (
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
  deleted_at is null
  and exists (
    select 1
    from orders o
    where o.id = order_items.order_id
      and o.deleted_at is null
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
      and o.deleted_at is null
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
  deleted_at is null
  and exists (
    select 1
    from orders o
    where o.id = order_id
      and o.deleted_at is null
      and (
        o.user_id = auth.uid()    -- Authenticated users: their own orders
        or o.user_id is null      -- Guests: orders with no user_id
      )
  )
)
with check (
  deleted_at is null
  and exists (
    select 1
    from orders o
    where o.id = order_id
      and o.deleted_at is null
      and (
        o.user_id = auth.uid()    -- Authenticated users: their own orders
        or o.user_id is null      -- Guests: orders with no user_id
      )
  )
);

-- Users can delete order items from their own orders (soft delete by setting deleted_at)
drop policy if exists "Users can delete own order items" on order_items;
create policy "Users can delete own order items"
on order_items
for delete
using (
  deleted_at is null
  and exists (
    select 1
    from orders o
    where o.id = order_id
      and o.deleted_at is null
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
-- Checkout Function – Atomic Order Creation
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
  WHERE id = p_cart_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found or already deleted';
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
      ON cp.id = ci.customised_product_id AND cp.deleted_at IS NULL
    JOIN products p
      ON p.id = cp.product_id AND p.deleted_at IS NULL
    WHERE ci.cart_id = p_cart_id
      AND ci.deleted_at IS NULL
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
      ON cp.id = ci.customised_product_id AND cp.deleted_at IS NULL
    JOIN products p
      ON p.id = cp.product_id AND p.deleted_at IS NULL
    WHERE ci.cart_id = p_cart_id
      AND ci.deleted_at IS NULL
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

  -- 7. Soft-delete cart items
  UPDATE cart_items
  SET deleted_at = now()
  WHERE cart_id = p_cart_id
    AND deleted_at IS NULL;

  -- 8. Soft-delete cart
  UPDATE carts
  SET deleted_at = now()
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
  deleted_at is null
  and (
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
  deleted_at is null
  and (
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
using (deleted_at is null);

