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
