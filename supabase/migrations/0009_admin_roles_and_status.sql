-- Owner/Admin RBAC for admin_users. See docs/AUTH.md for the full design.
--
-- - status distinguishes an active admin from a suspended one. Suspending
--   is meant to be instantly effective and fully reversible: the moment
--   status != 'active', is_admin() (and therefore every RLS write policy,
--   plus admin_users/activity_logs reads) starts rejecting that user, but
--   the row -- and the audit trail pointing at it -- stays intact.
-- - role is constrained to 'owner' | 'admin'. Only an Owner can create
--   another Owner, suspend/reactivate, or delete -- enforced in the API
--   routes that call these, not in RLS (admin_users still has no
--   client-write policy at all; every mutation goes through service_role
--   after the route verifies the caller's role server-side).
--
-- is_admin() and is_owner() are both `security definer` so they can read
-- admin_users without recursing through the RLS policy that itself calls
-- them -- same reasoning as the original is_admin() in 0001.

alter table admin_users
  add column status text not null default 'active';

alter table admin_users
  add constraint admin_users_status_check check (status in ('active', 'suspended'));

alter table admin_users
  add constraint admin_users_role_check check (role in ('owner', 'admin'));

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admin_users where id = auth.uid() and status = 'active'
  );
$$;

create or replace function is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admin_users
    where id = auth.uid() and status = 'active' and role = 'owner'
  );
$$;
