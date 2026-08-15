# i2i Admin Panel

Next.js (App Router, TypeScript) + Chakra UI v3 admin panel for the i2i website.
Talks directly to Supabase (Postgres + Auth + Storage) via `supabase-js` — there
is no separate backend server; CRUD goes straight through PostgREST, governed
by Row Level Security policies defined in `../supabase/migrations` (see
`../docs/SCHEMA.md` for the policy spec — table structure is in place, the
policies themselves are a Database + API TODO).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in values from the Supabase dashboard (Project Settings -> API)
npm run dev                  # http://localhost:3000
```

## Structure

- `app/` — one route per admin section: `/` (dashboard), `/team`, `/events`,
  `/projects`, `/media`, `/settings`. Each page currently has a `Coming soon`
  stub with a `TODO` comment describing what to build — see `lib/types.ts`
  for the exact fields available.
- `lib/supabase/client.ts` — browser Supabase client, for use in Client Components.
- `lib/supabase/server.ts` — server Supabase client, for use in Server Components /
  Route Handlers (cookie-based session, wired up once auth lands).
- `lib/types.ts` — TypeScript types mirroring every table in
  `../supabase/migrations/0001_init_schema.sql`. Source of truth for field names;
  if the migration changes, update this file in the same PR.
- `lib/queries/stats.ts` — signatures + spec for the 4 Home dashboard stat
  queries (count, last-updated, 7-day activity, and upcoming-events for the
  Events card); implementations are a Database + API TODO.

## Rules of the road

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe in client code — RLS is what protects
  the data, not key secrecy.
- `SUPABASE_SERVICE_ROLE_KEY` must **only** ever be read inside a Next.js Route
  Handler (server-side). It bypasses RLS entirely. Never import it into a
  Client Component or prefix it with `NEXT_PUBLIC_`.
- Don't rename columns/tables without updating `lib/types.ts` and the migration
  in the same change, and flagging it to the team — the public frontend site
  reads from these same tables directly.
