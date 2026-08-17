-- Storage object policies for the 4 buckets created in 0002.
-- Owner: Database + API. Spec: docs/SCHEMA.md ("Storage buckets").
--
-- Same access model as the content tables: public read, admin-only write,
-- with `is_admin()` (defined in 0001) as the single gate.
--
-- Like 0003, this first drops policies that were created by hand in the
-- Supabase SQL editor. All four were `to public` with a `true` expression and
-- no bucket_id scoping at all, which meant any anon caller could upload,
-- overwrite, or delete any object in any bucket -- arbitrary file hosting under
-- the project's domain.
--
-- Note on reads: these buckets are `public = true`, so the CDN route
-- (/storage/v1/object/public/<bucket>/<path>) serves objects without consulting
-- RLS. The select policies below govern the authenticated API route. Reads are
-- public either way -- that is intended, these are website images -- but do not
-- read the select policy as if it were hiding anything.
--
-- Policy names must be unique across storage.objects as a whole, hence the
-- bucket-name prefix on each.

-- ---------------------------------------------------------------------------
-- 1. Drop the hand-created permissive policies
-- ---------------------------------------------------------------------------
drop policy if exists "Public storage read"   on storage.objects;
drop policy if exists "Public storage insert" on storage.objects;
drop policy if exists "Public storage update" on storage.objects;
drop policy if exists "Public storage delete" on storage.objects;

-- ---------------------------------------------------------------------------
-- 2. team-photos -- team_members.image_url
-- ---------------------------------------------------------------------------
create policy team_photos_select_all
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'team-photos');

create policy team_photos_insert_admin
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'team-photos' and (select is_admin()));

create policy team_photos_update_admin
  on storage.objects for update
  to authenticated
  using (bucket_id = 'team-photos' and (select is_admin()))
  with check (bucket_id = 'team-photos' and (select is_admin()));

create policy team_photos_delete_admin
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'team-photos' and (select is_admin()));

-- ---------------------------------------------------------------------------
-- 3. event-images -- events.image_url
-- ---------------------------------------------------------------------------
create policy event_images_select_all
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'event-images');

create policy event_images_insert_admin
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-images' and (select is_admin()));

create policy event_images_update_admin
  on storage.objects for update
  to authenticated
  using (bucket_id = 'event-images' and (select is_admin()))
  with check (bucket_id = 'event-images' and (select is_admin()));

create policy event_images_delete_admin
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-images' and (select is_admin()));

-- ---------------------------------------------------------------------------
-- 4. startup-images -- startups.image_url
-- ---------------------------------------------------------------------------
create policy startup_images_select_all
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'startup-images');

create policy startup_images_insert_admin
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'startup-images' and (select is_admin()));

create policy startup_images_update_admin
  on storage.objects for update
  to authenticated
  using (bucket_id = 'startup-images' and (select is_admin()))
  with check (bucket_id = 'startup-images' and (select is_admin()));

create policy startup_images_delete_admin
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'startup-images' and (select is_admin()));

-- ---------------------------------------------------------------------------
-- 5. media-gallery -- standalone Media Manager uploads
-- ---------------------------------------------------------------------------
create policy media_gallery_select_all
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media-gallery');

create policy media_gallery_insert_admin
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media-gallery' and (select is_admin()));

create policy media_gallery_update_admin
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media-gallery' and (select is_admin()))
  with check (bucket_id = 'media-gallery' and (select is_admin()));

create policy media_gallery_delete_admin
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media-gallery' and (select is_admin()));
