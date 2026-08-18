-- Points image_url/url at the real Supabase Storage object now that the
-- underlying files have been uploaded to their buckets, replacing the
-- temporary acideas2innovation.com URLs from 0007.
--
-- Verified before writing this migration: every row below was checked
-- against the actual bucket contents via the Storage list API (not
-- assumed), and every basename has a confirmed, exact, case-sensitive match
-- in its target bucket.
--
-- Scoped with `where ... like 'https://acideas2innovation.com/images/%'`,
-- so this only touches rows still on the old path -- safe to re-run, a
-- no-op on anything already migrated.

update team_members
set image_url = 'https://wkwevuetgoqglmkstarm.supabase.co/storage/v1/object/public/team-photos/'
  || regexp_replace(image_url, '^.*/', '')
where image_url like 'https://acideas2innovation.com/images/%';

update startups
set image_url = 'https://wkwevuetgoqglmkstarm.supabase.co/storage/v1/object/public/startup-images/'
  || regexp_replace(image_url, '^.*/', '')
where image_url like 'https://acideas2innovation.com/images/%';

-- media also gets storage_path populated -- NULL was how a row said "legacy
-- file, not in Storage" (see 0005); it no longer is one.
update media
set storage_path = regexp_replace(url, '^.*/', ''),
    url = 'https://wkwevuetgoqglmkstarm.supabase.co/storage/v1/object/public/media-gallery/'
      || regexp_replace(url, '^.*/', '')
where url like 'https://acideas2innovation.com/images/%';
