-- Row Level Security policies for the 7 content tables.
-- Owner: Database + API. Spec: docs/SCHEMA.md ("Row Level Security spec").
--
-- Why this is a new migration rather than an edit to 0001:
-- 0001 created the tables with RLS enabled and no policies, and it has already
-- been applied to the live project. CONTRIBUTING.md forbids editing an applied
-- migration, so the policies land here. 0001 stays frozen; its RLS TODO comment
-- is answered by this file.
--
-- This migration also drops a set of permissive policies that were created by
-- hand in the Supabase SQL editor and exist in no migration. Every one of them
-- was `for all to public using (true) with check (true)` -- RLS switched on but
-- enforcing nothing, which allowed any anon caller to insert themselves into
-- admin_users and thereby gain write access to every content table.
--
-- Access model:
--   team_departments  select: everyone                     write: is_admin()
--   media             select: everyone                     write: is_admin()
--   team_members      select: is_published or is_admin()   write: is_admin()
--   events            select: is_published or is_admin()   write: is_admin()
--   startups          select: is_published or is_admin()   write: is_admin()
--   admin_users       select: is_admin()                   write: none -- service_role only
--   activity_logs     select: is_admin()                   write: none -- service_role only
--
-- On this project anon and authenticated already hold table-level grants via
-- Supabase's default privileges, so RLS is the only thing gating access. There
-- is deliberately no `grant` statement below for the content tables.
--
-- is_admin() is defined in 0001 as `security definer`, which is what lets the
-- policy on admin_users query admin_users without recursing. Call it; never
-- reimplement the lookup inline.
--
-- It is wrapped as `(select is_admin())` throughout so Postgres evaluates it
-- once per statement as an InitPlan rather than once per row.

-- ---------------------------------------------------------------------------
-- 1. Drop the hand-created permissive policies
-- ---------------------------------------------------------------------------
-- `if exists` so this migration also applies cleanly to a fresh database
-- (local `supabase start`, a preview branch) where these never existed.

drop policy if exists "Enable full access for team_departments" on team_departments;
drop policy if exists "Public team_departments read"            on team_departments;
drop policy if exists "Enable full access for team_members"     on team_members;
drop policy if exists "Public team_members read"                on team_members;
drop policy if exists "Enable full access for events"           on events;
drop policy if exists "Public events read"                      on events;
drop policy if exists "Enable full access for startups"         on startups;
drop policy if exists "Public startups read"                    on startups;
drop policy if exists "Enable full access for media"            on media;
drop policy if exists "Public media read"                       on media;
drop policy if exists "Enable full access for admin_users"      on admin_users;
drop policy if exists "Enable full access for activity_logs"    on activity_logs;

-- ---------------------------------------------------------------------------
-- 2. Schema fixes
-- ---------------------------------------------------------------------------
-- The 21 rows seeded from data/media.json are files that live in the repo under
-- images/, not objects in a Storage bucket. NULL storage_path is how a row says
-- "legacy file, not in Storage"; the Media Manager sets it on real uploads.
alter table media alter column storage_path drop not null;

-- Natural keys so the seed in 0005 can use `on conflict ... do nothing` and be
-- safely re-run. team_departments.slug and startups.slug are already unique
-- from 0001; these two tables had nothing to key on.
-- `nulls not distinct` matters: department_id is nullable, and without it two
-- members with the same name and no department would both be allowed in.
create unique index if not exists team_members_department_id_name_key
  on team_members (department_id, name) nulls not distinct;

create unique index if not exists media_url_key
  on media (url);

-- ---------------------------------------------------------------------------
-- 3. team_departments -- public read, admin write
-- ---------------------------------------------------------------------------
create policy team_departments_select_all
  on team_departments for select
  to anon, authenticated
  using (true);

create policy team_departments_insert_admin
  on team_departments for insert
  to authenticated
  with check ((select is_admin()));

create policy team_departments_update_admin
  on team_departments for update
  to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

create policy team_departments_delete_admin
  on team_departments for delete
  to authenticated
  using ((select is_admin()));

-- ---------------------------------------------------------------------------
-- 4. team_members -- published rows public, everything visible to admins
-- ---------------------------------------------------------------------------
create policy team_members_select_published
  on team_members for select
  to anon, authenticated
  using (is_published or (select is_admin()));

create policy team_members_insert_admin
  on team_members for insert
  to authenticated
  with check ((select is_admin()));

create policy team_members_update_admin
  on team_members for update
  to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

create policy team_members_delete_admin
  on team_members for delete
  to authenticated
  using ((select is_admin()));

-- ---------------------------------------------------------------------------
-- 5. events
-- ---------------------------------------------------------------------------
create policy events_select_published
  on events for select
  to anon, authenticated
  using (is_published or (select is_admin()));

create policy events_insert_admin
  on events for insert
  to authenticated
  with check ((select is_admin()));

create policy events_update_admin
  on events for update
  to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

create policy events_delete_admin
  on events for delete
  to authenticated
  using ((select is_admin()));

-- ---------------------------------------------------------------------------
-- 6. startups
-- ---------------------------------------------------------------------------
create policy startups_select_published
  on startups for select
  to anon, authenticated
  using (is_published or (select is_admin()));

create policy startups_insert_admin
  on startups for insert
  to authenticated
  with check ((select is_admin()));

create policy startups_update_admin
  on startups for update
  to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

create policy startups_delete_admin
  on startups for delete
  to authenticated
  using ((select is_admin()));

-- ---------------------------------------------------------------------------
-- 7. media -- public read (it only ever holds already-public images)
-- ---------------------------------------------------------------------------
create policy media_select_all
  on media for select
  to anon, authenticated
  using (true);

create policy media_insert_admin
  on media for insert
  to authenticated
  with check ((select is_admin()));

create policy media_update_admin
  on media for update
  to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

create policy media_delete_admin
  on media for delete
  to authenticated
  using ((select is_admin()));

-- ---------------------------------------------------------------------------
-- 8. admin_users -- readable by admins, writable by nobody
-- ---------------------------------------------------------------------------
-- Deliberately no insert/update/delete policy. RLS is default-deny, so the
-- absence of a policy is what makes this table service_role-only: adding an
-- admin goes through the Next.js Route Handler using SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses RLS. A write policy here would let an admin promote anyone,
-- and a permissive one would let anyone promote themselves.
create policy admin_users_select_admin
  on admin_users for select
  to authenticated
  using ((select is_admin()));

-- ---------------------------------------------------------------------------
-- 9. activity_logs -- readable by admins, writable by nobody
-- ---------------------------------------------------------------------------
-- Same reasoning. If audit logging is wired up later, write it as a
-- `security definer` trigger on the content tables rather than adding an
-- insert policy -- an audit trail the audited party can write to is not one.
create policy activity_logs_select_admin
  on activity_logs for select
  to authenticated
  using ((select is_admin()));

-- ---------------------------------------------------------------------------
-- 10. Grant hardening
-- ---------------------------------------------------------------------------
-- Defense in depth for the two service_role-only tables. The policies above
-- already block these operations; revoking the grants means a future
-- accidentally-permissive policy on either table still cannot be exploited.
-- authenticated keeps select (gated to is_admin() above) so the Settings page
-- can list admins.
revoke all on table admin_users   from anon;
revoke all on table activity_logs from anon;

revoke insert, update, delete, truncate, references, trigger
  on table admin_users, activity_logs from authenticated;

-- RLS does not apply to TRUNCATE -- it is the one statement a policy cannot
-- restrict -- so it has to be revoked rather than gated.
revoke truncate on table team_departments, team_members, events, startups, media
  from anon, authenticated;
