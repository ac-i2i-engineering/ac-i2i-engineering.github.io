# i2i Admin Panel

Next.js (App Router, TypeScript) + Chakra UI v3 admin panel for the i2i website.
Talks directly to Supabase (Postgres + Auth + Storage) via `supabase-js` — there
is no separate backend server; CRUD goes straight through PostgREST, governed
by Row Level Security policies (see `../docs/SCHEMA.md`). Authentication is
Owner/Admin RBAC via Supabase Auth — see `../docs/AUTH.md` for the full design.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in values from the Supabase dashboard (Project Settings -> API)
npm run dev                  # http://localhost:3000
```

First time on a fresh project: bootstrap the first Owner before anything else
works (see `../docs/AUTH.md#bootstrapping-the-first-owner`):

```bash
node scripts/bootstrap-owner.mjs "you@example.com"
```

## Structure

- `app/(protected)/` — every admin page (`/`, `/team`, `/events`, `/projects`,
  `/media`, `/settings`), grouped so its `layout.tsx` can gate all of them on
  one `getAdminSession()` check without affecting `/login` or `/set-password`.
- `app/login/`, `app/set-password/` — outside the protected group, no
  sidebar/header chrome.
- `app/api/admin/invite/`, `app/api/admin/[id]/` — admin-user management.
  Authorization happens here, in application code, not via RLS — see
  `docs/AUTH.md#where-authorization-is-actually-enforced`.
- `proxy.ts` (repo root of `admin/`) — Next.js 16's renamed `middleware.ts`.
  Refreshes the session cookie every request and redirects requests with no
  Supabase session away from protected routes. Deliberately does not
  redirect an authenticated user away from `/login` — that page does its
  own `getAdminSession()` check, since "has a session" isn't the same as
  "is an active admin" and conflating the two caused an infinite redirect
  loop for a suspended admin.
- `lib/auth/session.ts` — `getAdminSession()` (server-only) and `isOwner()`.
  The single source of truth for "is this caller a real, active admin, and
  are they an Owner" — used by both `(protected)/layout.tsx` and every
  `api/admin/*` route.
- `lib/auth/SessionContext.tsx` — client-side access to the same session
  (`useAdminSession()`), for role-gated UI like the Settings page's
  suspend/delete buttons.
- `lib/supabase/client.ts` — browser Supabase client, for use in Client Components.
- `lib/supabase/server.ts` — server Supabase client, for use in Server Components /
  Route Handlers (cookie-based session).
- `lib/types.ts` — TypeScript types mirroring every table in
  `../supabase/migrations/`. Source of truth for field names; if a migration
  changes a column, update this file in the same PR.
- `lib/queries/stats.ts` — the 4 Home dashboard stat queries, backed by the
  `get_dashboard_stats()` RPC (`../supabase/migrations/0006_dashboard_stats.sql`).
- `scripts/bootstrap-owner.mjs` — one-time first-Owner setup, run manually.

## Rules of the road

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe in client code — RLS is what protects
  the data, not key secrecy.
- `SUPABASE_SERVICE_ROLE_KEY` must **only** ever be read inside a Next.js Route
  Handler or script (server-side). It bypasses RLS entirely. Never import it
  into a Client Component or prefix it with `NEXT_PUBLIC_`.
- Don't rename columns/tables without updating `lib/types.ts` and the migration
  in the same change, and flagging it to the team — the public frontend site
  reads from these same tables directly.
- Adding a new admin-management action (beyond invite/suspend/reactivate/delete)?
  Put the role check in the API route via `getAdminSession()`/`isOwner()`, not
  in a new RLS policy on `admin_users` — see `docs/AUTH.md`.
