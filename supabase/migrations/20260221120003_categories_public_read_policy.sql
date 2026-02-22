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
