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
