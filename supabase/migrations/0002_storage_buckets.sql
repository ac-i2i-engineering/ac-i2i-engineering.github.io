-- Storage buckets for the i2i admin panel.
-- All buckets are public-read (so the static frontend can hotlink images directly)
-- and admin-only write, matching the RLS pattern used for content tables.

insert into storage.buckets (id, name, public)
values
  ('team-photos', 'team-photos', true),
  ('event-images', 'event-images', true),
  ('startup-images', 'startup-images', true),
  ('media-gallery', 'media-gallery', true)
on conflict (id) do nothing;

-- TODO (Database + API): create policy statements on storage.objects for
-- each of the 4 buckets above, following the same pattern as the content
-- tables in 0001_init_schema.sql:
--
--   select                   using (bucket_id = '<bucket>')
--   insert                   with check (bucket_id = '<bucket>' and is_admin())
--   update                   using (bucket_id = '<bucket>' and is_admin())
--   delete                   using (bucket_id = '<bucket>' and is_admin())
--
-- Every bucket gets all 4 policies (select/insert/update/delete) — 16 policy
-- statements total. Verify with a real anon request that reads work while
-- writes are refused, and with a real admin account that writes succeed.