-- Wires up activity_logs, left as a stretch goal in 0001. Content mutations
-- (team_members/events/startups/media) all go straight from the browser to
-- Postgres via RLS -- there's no API route in the middle to log from -- so
-- logging happens here instead, as an AFTER trigger on each table. That also
-- means it can't be missed by a page that forgets to log a write: every
-- insert/update/delete is captured no matter which admin page did it.
--
-- security definer because activity_logs deliberately has no insert policy
-- for authenticated (see 0001/0003) -- same reasoning as is_admin()/is_owner().
create or replace function log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  entity_type_val text := TG_ARGV[0];
  actor uuid := auth.uid();
  actor_email_val text;
  row_data jsonb := to_jsonb(coalesce(new, old));
  display_name text := coalesce(
    row_data ->> 'title',
    row_data ->> 'name',
    row_data ->> 'caption',
    row_data ->> 'alt_text',
    'item'
  );
  summary_val text;
begin
  select email into actor_email_val from admin_users where id = actor;

  summary_val := case tg_op
    when 'INSERT' then 'Created ' || display_name
    when 'UPDATE' then 'Updated ' || display_name
    when 'DELETE' then 'Deleted ' || display_name
  end;

  insert into activity_logs (actor_id, actor_email, action, entity_type, entity_id, summary)
  values (actor, actor_email_val, lower(tg_op), entity_type_val, coalesce(new.id, old.id), summary_val);

  return coalesce(new, old);
end;
$$;

create trigger team_members_activity_log
  after insert or update or delete on team_members
  for each row execute function log_activity('team_member');

create trigger events_activity_log
  after insert or update or delete on events
  for each row execute function log_activity('event');

create trigger startups_activity_log
  after insert or update or delete on startups
  for each row execute function log_activity('startup');

create trigger media_activity_log
  after insert or update or delete on media
  for each row execute function log_activity('media');
