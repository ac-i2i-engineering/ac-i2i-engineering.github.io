-- Adds show/hide to the Media Manager, matching the is_published pattern
-- already used by team_members/events/startups. media.html reads this table
-- directly for the public Media Gallery page, so this actually controls what
-- shows there -- not just admin-panel-only state.
alter table media
  add column is_published boolean not null default true;

-- Replaces 0003's media_select_all ("it only ever holds already-public
-- images" -- no longer true now that hiding is possible). Admins still see
-- everything, including hidden items, so the Media Manager can list them.
drop policy media_select_all on media;

create policy media_select_all
  on media for select
  to anon, authenticated
  using (is_published = true or (select is_admin()));
