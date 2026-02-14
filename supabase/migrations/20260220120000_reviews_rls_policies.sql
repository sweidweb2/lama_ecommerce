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
