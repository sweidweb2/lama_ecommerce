-- Seed data

-- Split from consolidated schema migration. Fresh DB reset only.



-- ----- seeds -----

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

