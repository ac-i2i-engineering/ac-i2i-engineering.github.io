-- Home dashboard stats, as a single RPC.
-- Owner: Database + API. Consumer: UI (admin Home page), via
-- admin/lib/queries/stats.ts.
--
-- The dashboard needs, per card: a total, a count updated in the last 7 days,
-- and the most recent updated_at -- plus an "upcoming" count for Events. Doing
-- that with supabase-js `count: 'exact', head: true` calls is 13 round trips to
-- render one page; this returns the whole thing in one.
--
-- SECURITY INVOKER (the default, stated explicitly because it matters here):
-- the function runs with the caller's privileges, so RLS still applies. An anon
-- caller counts only published rows; a signed-in admin counts everything. There
-- is no separate authorization check to keep in sync -- the policies from 0003
-- do the work. Making this SECURITY DEFINER would leak unpublished counts to
-- logged-out visitors.
--
-- Returns:
--   { "teamMembers": { total, updatedLast7Days, lastUpdatedAt },
--     "events":      { total, updatedLast7Days, lastUpdatedAt, upcoming },
--     "startups":    { ... }, "media": { ... } }
-- Keys are camelCase to match the TypeScript interfaces they deserialize into.

create or replace function get_dashboard_stats()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  select json_build_object(
    'teamMembers', (
      select json_build_object(
        'total',            count(*),
        'updatedLast7Days', count(*) filter (where updated_at >= now() - interval '7 days'),
        'lastUpdatedAt',    max(updated_at)
      ) from team_members
    ),
    'events', (
      select json_build_object(
        'total',            count(*),
        'updatedLast7Days', count(*) filter (where updated_at >= now() - interval '7 days'),
        'lastUpdatedAt',    max(updated_at),
        -- "Upcoming" is relative to the college's local date, not the server's.
        -- The database runs in UTC, so a plain current_date would roll over at
        -- 8pm Amherst time and drop the same evening's event from the count.
        'upcoming',         count(*) filter (
                              where is_published
                                and event_date >= (now() at time zone 'America/New_York')::date
                            )
      ) from events
    ),
    'startups', (
      select json_build_object(
        'total',            count(*),
        'updatedLast7Days', count(*) filter (where updated_at >= now() - interval '7 days'),
        'lastUpdatedAt',    max(updated_at)
      ) from startups
    ),
    'media', (
      select json_build_object(
        'total',            count(*),
        'updatedLast7Days', count(*) filter (where updated_at >= now() - interval '7 days'),
        'lastUpdatedAt',    max(updated_at)
      ) from media
    )
  );
$$;

grant execute on function get_dashboard_stats() to anon, authenticated;
