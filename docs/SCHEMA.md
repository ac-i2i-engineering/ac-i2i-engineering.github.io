# Database Schema Reference

Source of truth: everything in [`supabase/migrations/`](../supabase/migrations),
applied in order — `0001` tables/triggers/`is_admin()`, `0002` Storage buckets,
`0003` RLS policies, `0004` Storage policies, `0005` seed data, `0006` dashboard
stats RPC, `0007`–`0008` image URL fixes, `0009` Owner/Admin roles + `is_owner()`.
TypeScript mirror: [`admin/lib/types.ts`](../admin/lib/types.ts).

If you change a column, update the migration, `lib/types.ts`, and this table
in the same PR — the public site and the admin panel both depend on these
names matching exactly.

## Tables

| Table | Purpose | Public read | Admin write |
|---|---|---|---|
| `team_departments` | ~7 rows: Engineering, Financing, Creative, Consulting, ... | all rows | yes |
| `team_members` | Individual people, linked to a department, `is_lead` flags leadership | published rows | yes |
| `events` | Calendar events | published rows | yes |
| `startups` | Projects/Startups showcase | published rows | yes |
| `media` | Uploaded images, optionally attached to a team member/event/startup | all rows | yes |
| `admin_users` | Allowlist of who can sign in to `/admin` and write data. `role` is `owner` \| `admin`; `status` is `active` \| `suspended` (`0009`) | admin-only | **no** — service_role only |
| `activity_logs` | Audit trail of content changes (optional/stretch) | admin-only | **no** — service_role only |

"Admin write" is enforced by RLS via the `is_admin()` helper function, which
checks `auth.uid()` exists in `admin_users` **and** `status = 'active'`
(`0009`) — a suspended admin loses write access the instant their row is
updated, no session invalidation required. There is no other gate —
whoever has an active row in `admin_users` can write to every content
table. `is_owner()` (also `0009`) additionally requires `role = 'owner'`,
used to gate admin-user management — see [`docs/AUTH.md`](AUTH.md) for the
full Owner/Admin design and why that's enforced in application code rather
than another RLS policy.

## Row Level Security

**Owner: Database + API.** `0001_init_schema.sql` enables RLS on every table
and ships no policies; the policies live in
[`0003_rls_policies.sql`](../supabase/migrations/0003_rls_policies.sql) (content
tables) and [`0004_storage_policies.sql`](../supabase/migrations/0004_storage_policies.sql)
(Storage). `0001` is applied and frozen — don't move them back into it.

This is what is enforced:

| Table | `select` | `insert` / `update` / `delete` |
|---|---|---|
| `team_departments` | `using (true)` — everyone | `is_admin()` |
| `team_members` | `using (is_published = true or is_admin())` | `is_admin()` |
| `events` | `using (is_published = true or is_admin())` | `is_admin()` |
| `startups` | `using (is_published = true or is_admin())` | `is_admin()` |
| `media` | `using (true)` — everyone | `is_admin()` |
| `admin_users` | `using (is_admin())` | **no policy at all** — writes only via `service_role`, bypassing RLS entirely |
| `activity_logs` | `using (is_admin())` | **no policy at all** — writes only via `service_role` |

Reads are scoped `to anon, authenticated` and writes `to authenticated`. A
policy with no role list applies to `PUBLIC` — every role — which is how the
database briefly ended up with no access control at all; state the roles.

`is_admin()` is defined in `0001` as `security definer`, which is what lets the
policy on `admin_users` query `admin_users` without recursing. Call it, don't
reimplement the lookup inline. It is wrapped as `(select is_admin())` so
Postgres evaluates it once per statement instead of once per row.

**On `anon` having table grants:** this project uses Supabase's default
privileges, so `anon` and `authenticated` hold `select`/`insert`/`update`/
`delete` on every table in `public` automatically, including tables added
later. RLS is therefore the *only* thing gating access — there is nothing to
"also" lock down, and a permissive policy is immediately exploitable.
`admin_users` and `activity_logs` are the exception: `0003` revokes those
grants outright as a second layer, since nothing should ever write to them
from the client. `TRUNCATE` is also revoked on the content tables, because RLS
does not apply to `TRUNCATE`.

Before merging a policy change, verify both directions for at least one table:
a real anon (logged-out) request gets the expected rows and nothing more, and a
real signed-in admin request can write.

## Storage buckets

| Bucket | Used by |
|---|---|
| `team-photos` | `team_members.image_url` |
| `event-images` | `events.image_url` |
| `startup-images` | `startups.image_url` |
| `media-gallery` | standalone Media Manager uploads |

All buckets are public-read, admin-write (same `is_admin()` check) — 16
policies on `storage.objects` in `0004`, four per bucket, each scoped by
`bucket_id`.

Because the buckets are `public = true`, the CDN route
(`/storage/v1/object/public/<bucket>/<path>`) serves objects without consulting
RLS at all. The `select` policies govern the authenticated API route. Reads are
public either way — these are website images — so don't read the `select`
policy as though it hides something.

## Seed data

[`0005_seed_initial_content.sql`](../supabase/migrations/0005_seed_initial_content.sql)
loaded the site's committed JSON (now legacy, no longer read by any page —
see `docs/ARCHITECTURE.md`): `team.json` → 4 departments + 5 members,
`startups.json` → 6 startups, `data/media.json` → 21 media rows. Every
insert in `0005` is `on conflict … do nothing`, so re-running it is a no-op.

Two migrations fixed up the image paths `0005` wrote, in sequence:

- [`0007_fix_legacy_image_urls.sql`](../supabase/migrations/0007_fix_legacy_image_urls.sql)
  absolutized the bare `images/...` paths `0005` wrote to
  `https://acideas2innovation.com/images/...` — a relative path only
  resolves against the public site's own origin, and the admin panel is a
  different origin.
- [`0008_migrate_images_to_storage.sql`](../supabase/migrations/0008_migrate_images_to_storage.sql)
  replaced those with the real Supabase Storage URL once the files were
  uploaded to their buckets, and populated `media.storage_path` (previously
  `NULL`, which is how a row said "legacy file, not in Storage" — it no
  longer is one). The local `images/...` copies these used to point at are
  gone from the repo as of this same change; see the commit that added
  `0008` for the reasoning.

Two field renames to watch, since the JSON and the schema disagree:
`startups.json` `test_url`/`test_text` map to `demo_url`/`demo_text`, and its
`id` becomes a lowercased `slug`.

## Dashboard stats

[`0006_dashboard_stats.sql`](../supabase/migrations/0006_dashboard_stats.sql)
defines `get_dashboard_stats()`, one RPC returning every Home-page card stat as
JSON. It is `security invoker`, so RLS applies to it normally — admins get
counts over all rows, anyone else over published rows only. Consumed by
[`admin/lib/queries/stats.ts`](../admin/lib/queries/stats.ts).

## Applying migrations

```bash
npx supabase login                 # one-time, opens a browser to authorize
npx supabase link --project-ref <ref>   # from the Supabase dashboard URL
npx supabase db push               # applies supabase/migrations/*.sql in order
```

New migrations: add a new numbered file to `supabase/migrations/` — never edit
one that has already been applied to the live project — then `db push` again.

Never create tables or policies by hand in the dashboard SQL editor. `0001` and
`0002` were originally applied that way, which left the live database holding
access rules that existed in no file and that git could not show. Recovering
from it took `supabase migration repair --status applied 0001 0002` plus a
column-by-column audit against the migration.
