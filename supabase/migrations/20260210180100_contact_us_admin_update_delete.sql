--------------------------------------------------
-- Allow admins to update and delete contact messages
--------------------------------------------------

drop policy if exists "Admins can update contact messages" on contact_us;
drop policy if exists "Admins can delete contact messages" on contact_us;

create policy "Admins can update contact messages"
on contact_us
for update
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete contact messages"
on contact_us
for delete
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
);
