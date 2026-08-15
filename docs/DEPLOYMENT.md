# Deployment

Three pieces, three targets, deployed independently.

## Public website — GitHub Pages

Already live, no setup needed. This repo is named
`ac-i2i-engineering.github.io`, so GitHub serves the root of `main` directly
at that URL, with `CNAME` pointing the custom domain
(`acideas2innovation.com`) at it. Every push to `main` that touches root-level
files (`*.html`, `css/`, `js/`, `images/`, `*.json`) goes live within a
minute or two — no build step, no Action required.

## Database/Auth/Storage — Supabase

One-time setup (already done: the `i2i-website` project exists):

```bash
npx supabase login                        # opens a browser to authorize
npx supabase link --project-ref <ref>     # ref is in the dashboard URL, or: npx supabase projects list
npx supabase db push                      # applies supabase/migrations/*.sql
```

Then grab the values every deploy target needs from
**Project Settings → API**:

| Value | Used by |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` (server-only, never `NEXT_PUBLIC_*`) |

**Before this matters in practice:** the RLS policy `TODO`s in
`supabase/migrations/0001_init_schema.sql` and `0002_storage_buckets.sql`
need to be filled in (see [`SCHEMA.md`](SCHEMA.md#row-level-security-spec)).
`db push` works fine either way — tables are created with RLS enabled and no
policies, meaning everything is locked down (safe default) until the
policies are added and pushed as a follow-up migration.

## Admin panel — Vercel

1. [vercel.com/new](https://vercel.com/new) → import this GitHub repo.
2. **Root Directory: `admin`** — this is the one setting that isn't
   auto-detected; Vercel will otherwise try to build the repo root.
3. Framework preset: Next.js (auto-detected once the root directory is set).
4. Environment variables (Project Settings → Environment Variables), same
   three values as the table above:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — mark server-only; double check it's never
     exposed to the client bundle.
5. Deploy. From here on, every push to `main` that touches `admin/**`
   auto-deploys — no GitHub Action needed, Vercel's GitHub integration
   handles it.

## Summary

| Piece | Host | Deploys on | Manual step required |
|---|---|---|---|
| Public site | GitHub Pages | push to `main` | none — already configured |
| Admin panel | Vercel | push to `main` (after import) | one-time: import repo, set root dir + env vars |
| Database | Supabase | `supabase db push` | run manually when migrations change — not automatic |
