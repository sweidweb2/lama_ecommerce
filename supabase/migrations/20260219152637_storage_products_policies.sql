-- Admin upload policy for products bucket

create policy "Admins can upload product images"
on storage.objects
for insert
with check (
  bucket_id = 'products'
  and auth.role() = 'authenticated'
  and public.get_user_role() = 'admin'::profile_role
);

