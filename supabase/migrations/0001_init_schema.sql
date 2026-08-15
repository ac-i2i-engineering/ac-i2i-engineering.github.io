-- i2i Admin Panel — initial schema
-- Tables: team_departments, team_members, events, startups, media, admin_users, activity_logs
-- Storage buckets: team-photos, event-images, startup-images, media-gallery
--
-- Convention: every content table has `is_published` (or is always public) and is readable by
-- anon/public for published rows; writes require the caller's auth.uid() to exist in admin_users.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. team_departments
-- ---------------------------------------------------------------------------
create table team_departments (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  subtitle    text,
  description text,
  link_url    text,
  link_text   text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. team_members
-- ---------------------------------------------------------------------------
create table team_members (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid references team_departments(id) on delete set null,
  name          text not null,
  role          text,
  image_url     text,
  alt_text      text,
  is_lead       boolean not null default false,
  sort_order    int not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. events
-- ---------------------------------------------------------------------------
create table events (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  event_date        date not null,
  start_time        time,
  end_time          time,
  location          text,
  image_url         text,
  registration_url  text,
  is_published      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. startups
-- ---------------------------------------------------------------------------
create table startups (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  description   text,
  image_url     text,
  image_alt     text,
  github_url    text,
  github_text   text default 'GitHub Project Repository→',
  demo_url      text,
  demo_text     text,
  tags          text[] not null default '{}',
  sort_order    int not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. media
-- ---------------------------------------------------------------------------
create table media (
  id                uuid primary key default gen_random_uuid(),
  storage_path      text not null,
  url               text not null,
  alt_text          text,
  caption           text,
  attached_to_type  text check (attached_to_type in ('team_member', 'event', 'startup')),
  attached_to_id    uuid,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. admin_users (allowlist — no client-side writes, service_role only)
-- ---------------------------------------------------------------------------
create table admin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text,
  role        text not null default 'admin',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 7. activity_logs (schema ready now; logging wiring is a stretch goal)
-- ---------------------------------------------------------------------------
create table activity_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references admin_users(id) on delete set null,
  actor_email   text,
  action        text not null check (action in ('create', 'update', 'delete')),
  entity_type   text not null check (entity_type in ('team_member', 'event', 'startup', 'media')),
  entity_id     uuid,
  summary       text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at auto-touch trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_team_departments_updated_at before update on team_departments
  for each row execute function set_updated_at();
create trigger trg_team_members_updated_at before update on team_members
  for each row execute function set_updated_at();
create trigger trg_events_updated_at before update on events
  for each row execute function set_updated_at();
create trigger trg_startups_updated_at before update on startups
  for each row execute function set_updated_at();
create trigger trg_media_updated_at before update on media
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- helper: is the current request from a signed-in admin?
-- ---------------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admin_users where id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- RLS is turned on for every table below (default-deny: with no policy, an
-- operation is refused). Writing the actual `create policy` statements is
-- owned by Database + API — see docs/SCHEMA.md for the full spec. Summary:
--
--   team_departments  select: everyone (true)             write: is_admin()
--   team_members      select: is_published or is_admin()  write: is_admin()
--   events            select: is_published or is_admin()  write: is_admin()
--   startups          select: is_published or is_admin()  write: is_admin()
--   media             select: everyone (true)             write: is_admin()
--   admin_users        select: is_admin() only  — NO insert/update/delete policy at all (service_role only)
--   activity_logs      select: is_admin() only  — NO insert/update/delete policy at all (service_role only)
--
-- "write" means insert + update + delete all gated the same way, using
-- `with check (is_admin())` on insert/update and `using (is_admin())` on
-- update/delete. For admin_users and activity_logs, deliberately add no
-- write policy of any kind — that's what makes them service_role-only.
--
-- Before this migration is applied to the live project (`supabase db push`),
-- add the `create policy` statements for all 7 tables here, then verify with
-- a real anon (logged-out) request that reads are scoped correctly, and with
-- a real admin account that writes work.
alter table team_departments enable row level security;
alter table team_members     enable row level security;
alter table events           enable row level security;
alter table startups         enable row level security;
alter table media            enable row level security;
alter table admin_users      enable row level security;
alter table activity_logs    enable row level security;

-- TODO (Database + API): create policy statements per the spec above.
