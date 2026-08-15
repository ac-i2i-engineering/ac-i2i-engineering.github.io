# Contributing

Contribution conventions for the i2i platform (public site + admin panel +
Supabase backend). 

## Getting started

Running everything locally: [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md).
Deploying: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Table/column reference:
[`docs/SCHEMA.md`](docs/SCHEMA.md) — the contract everyone builds against,
keep it accurate.

## Branches

`<type>/<short-description>`, e.g. `feat/team-crud`, `fix/events-date-picker`.
Branch off `main`, open a PR into `main` when ready.

## Code style

- TypeScript strict mode is on — don't work around type errors with `any` or
  `// @ts-ignore` without a comment explaining why it's unavoidable.
- Run `npm run lint` in `admin/` before opening a PR; fix warnings, don't
  suppress them.
- Prefer Chakra UI components over hand-written CSS in `admin/`.
- No commented-out code or leftover debug logging in a PR.

## Testing / QA

There's no automated test suite for this sprint — manually verify your
change in the browser (`npm run dev`) before requesting review, including at
least one non-happy-path case (empty state, a required field left blank,
etc.). Once CI is wired up, it runs lint + build on every PR — that must be
green before merge, but a green CI run is not a substitute for having
actually clicked through the change.

## Database changes

- Every schema change is a new migration file (`npx supabase migration new
  <name>`) — never hand-edit a migration that's already been applied to the
  shared project.
- Update `admin/lib/types.ts` and `docs/SCHEMA.md` in the same PR.
- After merging, whoever owns the Supabase project runs `npx supabase db
  push` and confirms in the group chat that it's applied — don't assume it
  happened automatically.

## Pull requests

- Keep them small and merge fast — we don't have time for long-lived branches.
- Fill out the PR template checklist (build passes, lint passes, no secrets
  committed).
- Squash merge, so `main`'s history stays one commit per change.
- One quick look from someone else before merging if they're free; don't
  block on it if the change is low-risk and time is short.

## Environment variables & secrets

Never commit `.env.local` or any real Supabase keys. Copy `admin/.env.example`
to `admin/.env.local` and fill in your own values. `SUPABASE_SERVICE_ROLE_KEY`
is server-only — it must never appear in a Client Component or anything
prefixed `NEXT_PUBLIC_`. If you accidentally commit a secret, say so
immediately so it can be rotated — don't just quietly amend it away, the
history still has it until it's rotated.

## Security basics

RLS policies are the actual access-control boundary, not the admin UI —
if you add or change a policy, verify it with a real anon (logged-out)
request, not just by clicking around while signed in as an admin.
