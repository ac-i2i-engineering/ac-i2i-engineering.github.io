# Supabase Project

Schema and Storage config for the i2i admin panel, managed as SQL migrations
so the live database is reproducible and reviewable in PRs like any other code.

See [`../docs/SCHEMA.md`](../docs/SCHEMA.md) for the table reference and
[`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for how this fits together
with the admin panel and public site.

## First-time setup (one person, once)

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard) (free tier).
2. `npx supabase login`
3. `npx supabase link --project-ref <ref>` (the ref is in the project's dashboard URL)
4. **Fill in the RLS policy `TODO`s** in `migrations/0001_init_schema.sql` and
   `migrations/0002_storage_buckets.sql` — see [`../docs/SCHEMA.md`](../docs/SCHEMA.md#row-level-security-spec)
   for the exact spec. Table structure is already there; the policies aren't yet.
5. `npx supabase db push` — applies every file in `migrations/` in order.
6. Copy the Project URL + anon key + service_role key from Project Settings ->
   API into `admin/.env.local` (see `admin/.env.example`).

## Making schema changes

Never hand-edit the schema in the Supabase dashboard for anything that should
persist — add a new migration file instead:

```bash
npx supabase migration new <short_description>
# edit the generated SQL file in supabase/migrations/
npx supabase db push
```

## Local development (optional)

`npx supabase start` runs the full stack (Postgres, Auth, Storage, Studio) in
Docker for local iteration without touching the shared project. Requires
Docker Desktop.
