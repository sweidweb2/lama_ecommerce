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

