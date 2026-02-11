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
