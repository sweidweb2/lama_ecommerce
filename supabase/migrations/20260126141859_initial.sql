-- create table products (
--   id uuid primary key default gen_random_uuid(),
--   name text not null,
--   price numeric not null,
--   created_at timestamptz default now()
-- );

-- Enable UUID extension
create extension if not exists "uuid-ossp";

--------------------------------------------------
-- PROFILE
--------------------------------------------------
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id),
  full_name text,
  role enum('user', 'admin') not null default 'user',
  created_at timestamptz default now(),
  deleted_at timestamptz
);

--------------------------------------------------
-- USER ADDRESS
--------------------------------------------------
create table user_addresses (
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  url_image text not null,
  is_primary boolean default false,
  created_at timestamptz default now()
);

--------------------------------------------------
-- PRODUCT VARIANTS (CUSTOMISED PRODUCT)
--------------------------------------------------
create table customised_products (
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  customised_product_id uuid not null references customised_products(id),
  created_at timestamptz default now(),
  deleted_at timestamptz
);

--------------------------------------------------
-- CART
--------------------------------------------------
create table carts (
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  rating integer check (rating between 1 and 5),
  title text,
  comment text,
  review_status enum('pending', 'approved', 'rejected') default 'pending',
  created_at timestamptz default now(),
  deleted_at timestamptz,
  unique (product_id, user_id)
);

--------------------------------------------------
-- PRODUCT QUESTIONS & ANSWERS
--------------------------------------------------
create table product_questions (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id),
  user_id uuid references auth.users(id) on delete set null,
  question text not null,
  is_approved boolean default false,
  created_at timestamptz default now()
);

create table product_answers (
  id uuid primary key default uuid_generate_v4(),
  product_question_id uuid not null references product_questions(id) on delete cascade,
  admin_id uuid references auth.users(id) on delete set null,
  answer text not null,
  created_at timestamptz default now()
);

--------------------------------------------------
-- ORDERS
--------------------------------------------------
create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  status enum('pending', 'processing','packed', 'shipped', 'delivered', 'returned', 'cancelled') not null,
  subtotal numeric(10,2),
  shipping_fee numeric(10,2),
  discount numeric(10,2),
  total numeric(10,2),
  payment_status enum('pending', 'paid', 'failed', 'refunded') not null,
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
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id),
  status enum('pending', 'paid', 'failed', 'refunded') not null,
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
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  estimated_time text,
  created_at timestamptz default now()
);

create table shipping_fees (
  id uuid primary key default uuid_generate_v4(),
  zone_id uuid not null references shipping_zones(id) on delete cascade,
  fee numeric(10,2),
  created_at timestamptz default now()
);

create table shipments (
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  created_at timestamptz default now()
);

create table contact_us (
  id uuid primary key default uuid_generate_v4(),
  subject text,
  message text,
  full_name text,
  phone text,
  email text,
  status enum('new', 'read', 'replied', 'resolved') default 'new',
  created_at timestamptz default now()
);

--------------------------------------------------
-- PROMO CODES
--------------------------------------------------
create table promo_codes (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  discount_type enum('percentage', 'fixed') not null,
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
create index idx_orders_shipping_address_id on orders(shipping_address_id);
create index idx_orders_promo_id on orders(promo_id);

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

-- Add foreign key constraint for orders.promo_id (after promo_codes table is created)
alter table orders add constraint fk_orders_promo_id foreign key (promo_id) references promo_codes(id) on delete set null;

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
