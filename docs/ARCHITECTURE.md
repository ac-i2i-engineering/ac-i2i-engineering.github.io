# Architecture

Three independently deployed pieces, one repo:

```
/                 public website — static HTML/CSS/vanilla JS, unchanged in spirit
                  hosted on GitHub Pages (see CNAME)

/admin            admin panel — Next.js + TypeScript + Chakra UI
                  hosted on Vercel, auto-deploys on push

/supabase         database — Postgres schema, RLS policies, Storage buckets
                  hosted on Supabase (free tier to start)
```

There is no custom backend server. The admin panel and the public site both
talk to Supabase directly:

- **Admin panel** uses `supabase-js` with the anon key for all reads and, for
  authenticated admins, writes (allowed by RLS policies keyed off an
  `admin_users` allowlist table). A couple of privileged operations (managing
  `admin_users` itself) go through a Next.js Route Handler using the
  `service_role` key, since those tables have no client-write RLS policy at all.
- **Public site** fetches from Supabase's auto-generated REST API (PostgREST)
  with the anon key, the same way it currently does `fetch('team.json')` /
  `fetch('startups.json')` / `fetch('data/media.json')` — just pointed at
  Supabase instead of a local file.

## Why this stack choice? "instant updates"

The public site already fetches its data at page-load time rather than having
it baked in at build time (see `our-team.html`, `startups.html`, `media.html`).
Moving the source of truth from a committed JSON file to a Postgres table
doesn't change that pattern — it just means the admin panel's `INSERT`/`UPDATE`
lands in the same table the public site queries on next page load. No rebuild,
no redeploy, no cache-busting step required.

## Data flow

```
Admin panel  --(supabase-js, authenticated)-->  Supabase Postgres  <--(supabase-js, anon)--  Public site
                                                       |
                                                  Supabase Storage
                                                  (team/event/startup images, media gallery)
```

## Schema

See `supabase/migrations/0001_init_schema.sql` for the main schema
(7 tables: `team_departments`, `team_members`, `events`, `startups`, `media`,
`admin_users`, `activity_logs`) and `0002_storage_buckets.sql` for Storage
buckets. `admin/lib/types.ts` mirrors the schema in TypeScript — update both
together. Table structure is final; the RLS policies that actually enforce
the read/write rules described above are a Database + API TODO — see
`docs/SCHEMA.md` for the exact spec.

## Deployment + Production plan

| Piece | Free tier today | Paid upgrade path later |
|---|---|---|
| Public site | GitHub Pages | unchanged, or move to Vercel/Netlify |
| Admin panel | Vercel (Hobby) | Vercel Pro |
| Database/Auth/Storage | Supabase Free | Supabase Pro |

Each piece scales independently — no migration required to go from free to
paid, just upgrading the plan on the same project.
