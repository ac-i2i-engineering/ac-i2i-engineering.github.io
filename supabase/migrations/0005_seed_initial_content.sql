-- One-off seed: migrate the site's committed JSON into Postgres so the admin
-- panel and public site have real data to build against.
-- Owner: Database + API.
--
--   ../team.json        -> team_departments (4) + team_members (5)
--   ../startups.json    -> startups (6)
--   ../data/media.json  -> media (21)
--
-- Shipped as a migration rather than via supabase/seed.sql because `db push`
-- does not run seed.sql against a remote project -- it only runs on a local
-- `db reset`. As a migration it is reviewable in the PR and cannot be forgotten
-- by whoever applies it.
--
-- Image paths are kept exactly as they appear in the JSON ("images/...", served
-- from the GitHub Pages site). Nothing is uploaded to Storage today; that
-- happens later through the Media Manager. Accordingly media.storage_path is
-- left NULL, which 0003 made possible and which is how a row says "legacy file,
-- not in a bucket".
--
-- Every insert is `on conflict ... do nothing` against a real unique key, so
-- re-running this is a no-op rather than a duplicate. The keys are slug
-- (team_departments, startups, both from 0001), (department_id, name)
-- (team_members) and url (media), the latter two added in 0003.
--
-- Notes on the mapping, where the JSON and the schema disagree:
--   * startups.json "id"        -> slug, lowercased ("MatPlus" -> "matplus")
--   * startups.json "alt"       -> image_alt
--   * startups.json "test_url"  -> demo_url    (renamed in the schema)
--   * startups.json "test_text" -> demo_text
--   * startups.tags has no source in the JSON and seeds empty; it is an
--     admin-editable field and nothing on the public site renders it yet.
--   * team.json only contains team leads, so all 5 members get is_lead = true.
--     There is no source of non-lead members to seed.
--   * data/media.json is a bare array of paths with no alt text; the alt_text
--     below is written here rather than derived, replacing the camelCase-split
--     filenames the gallery currently generates client-side.
--
-- sort_order preserves the existing display order in each JSON file.

-- ---------------------------------------------------------------------------
-- 1. team_departments  <- team.json
-- ---------------------------------------------------------------------------
insert into team_departments (slug, title, subtitle, description, link_url, link_text, sort_order)
values
  ('engineering', 'Engineering Team', 'Design, code, deploy',
   'Whether it''s full-stack app development, system design, AI engineering, or simple API calls, it''s hard to have ideas that don''t need some type of engineering support these days. These engineers help design, code, and deploy ideas.',
   'https://github.com/ac-i2i-engineering', 'GitHub Organization →', 0),

  ('financing', 'Financing Team', 'Fund, manage, advise',
   'From grants to crowd-sourcing, there are various approaches to equip student ideas with monetary resources. But startups must be efficient and prudent with their limited finances. This team advises students on financial actions and strategy.',
   null, null, 1),

  ('creative', 'Creative Team', 'Curate a story',
   'Communication is the cornerstone of innovation. This is a team of storytellers who can transform concepts into compelling narratives and visual experiences. These members lead design and content production for i2i and student ideas in need of a voice.',
   null, null, 2),

  ('consulting', 'Consulting Team', 'Work 1:1 with startups',
   'We have a myriad of resources for big dreamers, and we want to make it effortless for ideas to grow. This team works 1-on-1 with students to facilitate the execution of their ideas by connecting all the pieces of i2i together.',
   null, null, 3)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 2. team_members  <- team.json "leaders"
-- ---------------------------------------------------------------------------
-- department_id is resolved by joining on the slug rather than hardcoding the
-- generated uuids, so this stays correct on any database.
insert into team_members (department_id, name, role, image_url, alt_text, is_lead, sort_order, is_published)
select d.id, v.name, v.role, v.image_url, v.alt_text, true, v.sort_order, true
from (values
  ('engineering', 'Ryan Ji',          'Executive Director of Engineering', 'images/ryan_ji.JPG',         'Ryan Ji - Engineering Team Lead',          0),
  ('engineering', 'Liam Davis',       'Executive Director of Engineering', 'images/liam_davis.jpg',      'Liam Davis - Engineering Team Lead',       1),
  ('financing',   'Nikolai Dammholz', 'Executive Director of Financing',   'images/financing-lead.png',  'Nikolai Dammholz - Financing Team Lead',   0),
  ('creative',    'Claire Liu',       'Executive Director of Creative',    'images/creative-lead.png',   'Claire Liu - Creative Team Lead',          0),
  ('consulting',  'Alex Nichols',     'Executive Director of Consulting',  'images/catalyst-lead.png',   'Alex Nichols - Consulting Team Lead',      0)
) as v (dept_slug, name, role, image_url, alt_text, sort_order)
join team_departments d on d.slug = v.dept_slug
on conflict (department_id, name) do nothing;

-- ---------------------------------------------------------------------------
-- 3. startups  <- startups.json
-- ---------------------------------------------------------------------------
insert into startups (slug, title, description, image_url, image_alt,
                      github_url, github_text, demo_url, demo_text,
                      tags, sort_order, is_published)
values
  ('amherst-connect', 'Amherst Connect',
   'Database and interface for events at Amherst. One-stop shop for looking at the big pictures of all events at Amherst!',
   'images/Amherst-Connect.png', 'Amherst Connect',
   'https://github.com/ac-i2i-engineering/access-amherst', 'GitHub Project Repository→',
   'https://amherst-connect.com/', 'Test the App→',
   '{}', 0, true),

  ('matching-engine', 'Matching Engine',
   'This is the matching engine we are building to match students with each other & ideas!',
   'images/Matching-Engine.png', 'Matching Engine',
   'https://github.com/ac-i2i-engineering/matching-engine', 'GitHub Project Repository→',
   null, null,
   '{}', 1, true),

  ('amherst-coursework', 'Amherst Coursework',
   'Amherst Coursework is a web application that provides Amherst College students and faculty with an intuitive, advanced interface for course search.',
   'images/amherst_coursework.png', 'Amherst Coursework',
   'https://github.com/ac-i2i-engineering/amherst-coursework', 'GitHub Project Repository→',
   'https://amherstcourses.com/', 'Test the App→',
   '{}', 2, true),

  ('resumax', 'Resumax',
   'Resumax is an AI chatbot designed to help students enhance their resumes effectively.',
   'images/resumax.png', 'Resumax',
   'https://github.com/ac-i2i-engineering/resumax', 'GitHub Project Repository→',
   null, null,
   '{}', 3, true),

  ('matplus', 'MatPlus',
   'A Python package for effortlessly creating stunning plots.',
   'images/mat_plus.png', 'MatPlus',
   'https://github.com/ac-i2i-engineering/mat-plus', 'GitHub Project Repository→',
   null, null,
   '{}', 4, true),

  ('lost-and-found', 'Amherst Lost and Found',
   'Each year, campuses gather tons of lost items—many go to landfills. Our Django-based Amherst Lost & Found app uses AI and maps to reunite items with owners, cutting waste and helping the planet.',
   'images/amherst-lost-and-found.png', 'Amherst Lost and Found',
   'https://github.com/Tetsuya787/LostandFound', 'GitHub Project Repository→',
   null, null,
   '{}', 5, true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 4. media  <- data/media.json
-- ---------------------------------------------------------------------------
insert into media (storage_path, url, alt_text, sort_order)
values
  (null, 'images/Media-Gallery/TeamDiscussion3.jpg', 'i2i members in discussion',        0),
  (null, 'images/Media-Gallery/Coding4.jpg',         'i2i members working on code',      1),
  (null, 'images/Media-Gallery/TeamPhoto2.jpg',      'i2i team photo',                   2),
  (null, 'images/Media-Gallery/Brainstorm1.jpg',     'i2i brainstorming session',        3),
  (null, 'images/Media-Gallery/TeamDiscussion7.jpg', 'i2i members in discussion',        4),
  (null, 'images/Media-Gallery/Coding1.jpg',         'i2i members working on code',      5),
  (null, 'images/Media-Gallery/TeamPhoto4.jpg',      'i2i team photo',                   6),
  (null, 'images/Media-Gallery/TeamDiscussion1.jpg', 'i2i members in discussion',        7),
  (null, 'images/Media-Gallery/Mentorship2.jpg',     'i2i mentorship session',           8),
  (null, 'images/Media-Gallery/Working1.jpg',        'i2i members working together',     9),
  (null, 'images/Media-Gallery/TeamDiscussion4.jpg', 'i2i members in discussion',       10),
  (null, 'images/Media-Gallery/Coding3.jpg',         'i2i members working on code',     11),
  (null, 'images/Media-Gallery/TeamPhoto1.jpg',      'i2i team photo',                  12),
  (null, 'images/Media-Gallery/TeamDiscussion8.jpg', 'i2i members in discussion',       13),
  (null, 'images/Media-Gallery/TeamDiscussion2.jpg', 'i2i members in discussion',       14),
  (null, 'images/Media-Gallery/TeamPhoto5.jpg',      'i2i team photo',                  15),
  (null, 'images/Media-Gallery/Coding5.jpg',         'i2i members working on code',     16),
  (null, 'images/Media-Gallery/TeamDiscussion5.jpg', 'i2i members in discussion',       17),
  (null, 'images/Media-Gallery/Mentorship1.jpg',     'i2i mentorship session',          18),
  (null, 'images/Media-Gallery/Brainstorm2.jpg',     'i2i brainstorming session',       19),
  (null, 'images/Media-Gallery/TeamPhoto3.jpg',      'i2i team photo',                  20)
on conflict (url) do nothing;
