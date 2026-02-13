-- Admin delete policy for products bucket

create policy "Admins can delete product images"
on storage.objects
for delete
using (
  bucket_id = 'products'
  and auth.role() = 'authenticated'
  and public.get_user_role() = 'admin'::profile_role
);
