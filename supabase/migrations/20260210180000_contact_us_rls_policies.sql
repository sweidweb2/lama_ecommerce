--------------------------------------------------
-- RLS policies for contact_us (public contact form)
--------------------------------------------------
-- Run this in Supabase SQL Editor if migrations aren't applied.
-- Drop first so re-running this script replaces existing policies.
--------------------------------------------------

drop policy if exists "Public can submit contact form" on contact_us;
drop policy if exists "Admins can read contact messages" on contact_us;

-- Allow anonymous and authenticated users to submit the contact form.
-- Supabase uses roles 'anon' (anonymous) and 'authenticated' (logged in).
create policy "Public can submit contact form"
on contact_us
for insert
to anon, authenticated
with check ( true );

-- Allow admins to read all contact messages in the dashboard.
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
