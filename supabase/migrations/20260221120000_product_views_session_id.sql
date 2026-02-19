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
