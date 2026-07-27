-- Row Level Security (enable + policies)

-- Split from consolidated schema migration. Fresh DB reset only.



-- ----- rls_enable -----

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
-- Source: 20260210180000_contact_us_rls_policies.sql
-- =============================================================================

--------------------------------------------------
-- RLS policies for contact_us (public contact form)
--------------------------------------------------

-- Always enable RLS explicitly (important for migrations)
alter table contact_us enable row level security;

-- =============================================================================
-- Source: 20260219152638_leads_rls_policies.sql
-- =============================================================================

-- RLS policies for leads (newsletter / email signup)

alter table leads enable row level security;

alter table backups enable row level security;

--------------------------------------------------
-- ENABLE RLS (if not already enabled)
--------------------------------------------------

alter table wishlists enable row level security;

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

alter table public.form_rate_limits enable row level security;

-- ----- policies -----

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

--------------------------------------------------
-- DROP EXISTING RLS POLICIES
--------------------------------------------------

-- Drop existing wishlist policies
drop policy if exists "Users can view own wishlist items" on wishlists;

drop policy if exists "Users can insert own wishlist items" on wishlists;

drop policy if exists "Users can delete own wishlist items" on wishlists;

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

