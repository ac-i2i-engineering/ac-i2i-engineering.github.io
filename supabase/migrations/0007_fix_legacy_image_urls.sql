-- Fixes broken images in the admin panel: 0005 seeded image_url/url columns
-- with bare relative paths copied from the old JSON files (e.g.
-- 'images/ryan_ji.JPG'). Those resolve fine on the public site's own origin
-- (acideas2innovation.com), but the admin panel is a separate origin with no
-- /images/ route, so every seeded <img> 404s there.
--
-- Fix: prefix the existing relative paths with the public site's origin.
-- These are still "legacy, not in a Storage bucket" rows (storage_path stays
-- NULL for media) -- this only makes the existing path resolvable from any
-- origin. Re-uploading through the Media Manager later replaces these with
-- real Storage URLs; not required for this fix.

update team_members
set image_url = 'https://acideas2innovation.com/' || image_url
where image_url like 'images/%';

update startups
set image_url = 'https://acideas2innovation.com/' || image_url
where image_url like 'images/%';

update media
set url = 'https://acideas2innovation.com/' || url
where url like 'images/%';
