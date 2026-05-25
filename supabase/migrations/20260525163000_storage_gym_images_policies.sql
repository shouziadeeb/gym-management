-- Production-ready storage policies for public image delivery and authenticated uploads.
-- Bucket: gym-images (public)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gym-images',
  'gym-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Public read gym-images" on storage.objects;
create policy "Public read gym-images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'gym-images');

drop policy if exists "Authenticated upload gym-images allowed folders" on storage.objects;
create policy "Authenticated upload gym-images allowed folders"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'gym-images'
    and (
      name like 'gyms/%'
      or name like 'reviews/%'
      or name like 'trainers/%'
      or name like 'profiles/%'
    )
  );

drop policy if exists "Authenticated update own gym-images" on storage.objects;
create policy "Authenticated update own gym-images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'gym-images' and owner = auth.uid())
  with check (bucket_id = 'gym-images' and owner = auth.uid());

drop policy if exists "Authenticated delete own gym-images" on storage.objects;
create policy "Authenticated delete own gym-images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'gym-images' and owner = auth.uid());
