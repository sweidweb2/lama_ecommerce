-- Admin upload policy for brands bucket

create policy "Admins can upload brand images"
on storage.objects
for insert
with check (
  bucket_id = 'brands'
  and auth.role() = 'authenticated'
  and public.get_user_role() = 'admin'::profile_role
);

