-- Lets an admin set a profile picture, shown in the account menu and the
-- Settings admin table instead of always falling back to initials.
alter table admin_users
  add column avatar_url text;

insert into storage.buckets (id, name, public)
values ('admin-avatars', 'admin-avatars', true)
on conflict (id) do nothing;

-- Same access model as the other 4 buckets (0004): public read (avatars are
-- not sensitive), admin-only write via is_admin(). Not scoped to "own avatar
-- only" -- the API route that persists admin_users.avatar_url only ever
-- writes the caller's own row regardless of what URL is uploaded, which is
-- the actual authorization boundary, same as every other admin-managed image.
create policy admin_avatars_select_all
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'admin-avatars');

create policy admin_avatars_insert_admin
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'admin-avatars' and (select is_admin()));

create policy admin_avatars_update_admin
  on storage.objects for update
  to authenticated
  using (bucket_id = 'admin-avatars' and (select is_admin()))
  with check (bucket_id = 'admin-avatars' and (select is_admin()));

create policy admin_avatars_delete_admin
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'admin-avatars' and (select is_admin()));
