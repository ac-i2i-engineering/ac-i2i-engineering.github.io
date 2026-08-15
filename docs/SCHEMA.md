# Database Schema Reference

Source of truth: [`supabase/migrations/0001_init_schema.sql`](../supabase/migrations/0001_init_schema.sql)
and [`0002_storage_buckets.sql`](../supabase/migrations/0002_storage_buckets.sql).
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
| `admin_users` | Allowlist of who can sign in to `/admin` and write data | admin-only | **no** — service_role only |
| `activity_logs` | Audit trail of content changes (optional/stretch) | admin-only | **no** — service_role only |

"Admin write" is enforced by RLS via the `is_admin()` helper function, which
checks whether `auth.uid()` exists in `admin_users`. There is no other gate —
whoever has a row in `admin_users` can write to every content table.

## Row Level Security spec

**Owner: Database + API.** The migration (`0001_init_schema.sql`) enables RLS
on every table but deliberately leaves the `create policy` statements as a
`TODO` — writing them is real backend work, not boilerplate. This is the spec
to implement against:

| Table | `select` | `insert` / `update` / `delete` |
|---|---|---|
| `team_departments` | `using (true)` — everyone | `is_admin()` |
| `team_members` | `using (is_published = true or is_admin())` | `is_admin()` |
| `events` | `using (is_published = true or is_admin())` | `is_admin()` |
| `startups` | `using (is_published = true or is_admin())` | `is_admin()` |
| `media` | `using (true)` — everyone | `is_admin()` |
| `admin_users` | `using (is_admin())` | **no policy at all** — writes only via `service_role`, bypassing RLS entirely |
| `activity_logs` | `using (is_admin())` | **no policy at all** — writes only via `service_role` |

For `insert`, the check goes in `with check (...)` instead of `using (...)`;
for `update`, both are needed (`using` gates which existing rows you can
touch, `with check` gates what you can change them to). `is_admin()` is
already defined in the migration — call it, don't reimplement the
`admin_users` lookup inline.

The same pattern applies to the 4 Storage buckets in
`0002_storage_buckets.sql` (policies on `storage.objects`, scoped by
`bucket_id`) — see the `TODO` comment in that file.

Before merging, verify both directions for at least one table: a real anon
(logged-out) request gets the expected rows and nothing more, and a real
signed-in admin request can write.

## Storage buckets

| Bucket | Used by |
|---|---|
| `team-photos` | `team_members.image_url` |
| `event-images` | `events.image_url` |
| `startup-images` | `startups.image_url` |
| `media-gallery` | standalone Media Manager uploads |

All buckets are public-read, admin-write (same `is_admin()` check).

## Applying migrations

```bash
npx supabase login                 # one-time, opens a browser to authorize
npx supabase link --project-ref <ref>   # from the Supabase dashboard URL
npx supabase db push               # applies supabase/migrations/*.sql in order
```

Fill in the RLS policy `TODO`s in `0001_init_schema.sql` and
`0002_storage_buckets.sql` (see the spec above) before the first `db push` —
until then, RLS is enabled with no policies, which means every table is
fully locked down to both anon and authenticated requests.

New migrations after that: add a new numbered file to `supabase/migrations/`
(don't edit `0001`/`0002` again once they've been applied to the live
project — add `0003_...sql` instead), then `supabase db push` again.
