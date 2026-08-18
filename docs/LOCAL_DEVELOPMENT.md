# Running the Project Locally

Three independent pieces (see [`ARCHITECTURE.md`](ARCHITECTURE.md)). You
generally only need to run the one you're working on.

## 1. Public website

No build step, no install.

```bash
npx serve .          # from the repo root, then open the printed localhost URL
```

Opening the HTML files directly (`file://...`) mostly works too, but some
browsers restrict pages loaded that way — `npx serve .` avoids that.

Team, Startups, and Media all fetch live from the shared Supabase project
(via `js/supabase-client.js`) rather than from a local JSON file, so you need
an internet connection for those pages to show data even when running fully
locally — there's no offline/local-only fallback.

## 2. Admin panel

Needs Node (version pinned in `admin/.nvmrc`) and Supabase project
credentials. If the shared project is already set up, ask whoever set it up
for the values below rather than creating your own — see
[`DEPLOYMENT.md`](DEPLOYMENT.md) if you're the one setting it up.

```bash
cd admin
nvm use                      # matches admin/.nvmrc
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is only needed if you're working
on the admin-invite API route — leave it blank otherwise.

## 3. Database

Day to day, you develop against the shared cloud Supabase project — you
don't need anything running locally for that, just the URL/anon key above.

If you want a fully offline copy to experiment with schema changes without
touching the shared project, Docker Desktop lets you run the whole stack
locally:

```bash
npx supabase start   # Postgres, Auth, Storage, Studio — all local
```

See [`../supabase/README.md`](../supabase/README.md) for schema/migration
commands either way.

## Useful checks before opening a PR

```bash
cd admin && npm run lint && npm run build
```
