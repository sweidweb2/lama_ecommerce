-- RLS policies for leads (newsletter / email signup)

alter table leads enable row level security;

-- Allow anyone to submit their email (footer signup)
create policy "Public can insert leads"
on leads
for insert
to public
with check (true);

-- Allow admins to read all leads (for admin panel when using session client)
create policy "Admins can read leads"
on leads
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
