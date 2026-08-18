# Admin Authentication

Owner/Admin RBAC, Supabase Auth (email/password), enforced at two layers:
RLS for content, application code for admin-user management. See
[`docs/SCHEMA.md`](SCHEMA.md) for the underlying tables/policies.

## Roles

Two roles: **Owner** and **Admin**. No third tier — a 3-person content
admin panel doesn't need one.

| Action | Admin | Owner |
|---|---|---|
| Edit content (Team/Events/Projects/Media) | yes | yes |
| Invite a new Admin | yes | yes |
| Invite a new **Owner** | no | yes |
| Promote an existing Admin to Owner | no | yes |
| Suspend / reactivate an admin | no | yes |
| Permanently delete an admin | no | yes |

An Admin inviting someone can never grant Owner — the invite API route
forces `role = 'admin'` server-side whenever the caller isn't an Owner,
regardless of what the request body asks for. Trusting client input here
would let any Admin mint a peer superuser and collapse the two-tier model.

More than one Owner is allowed, even though the system starts with exactly
one. A single-Owner system is a single point of failure: if that person is
unreachable, nobody can ever promote or demote anyone again without a
manual database fix.

## Suspend vs. delete

- **Suspend** — soft, reversible. Sets `admin_users.status = 'suspended'`.
  The row stays intact. `is_admin()` (and therefore every RLS policy that
  gates a write, plus reads of `admin_users`/`activity_logs`) starts
  rejecting that user immediately — their Auth session may still technically
  exist, but every action they attempt fails at the database.
- **Delete** — hard, permanent. Removes the `admin_users` row.
  `activity_logs.actor_id` has `on delete set null` with a denormalized
  `actor_email` column specifically so deleting an admin doesn't erase the
  record of what they did.

Both are Owner-only, and both refuse to proceed if the target is the last
remaining active Owner — the system will not let itself get locked out.

## Where authorization is actually enforced

Not by adding client-write RLS policies to `admin_users` — it keeps the
policy Reza built (no insert/update/delete policy for anon or
authenticated at all; every write goes through `service_role`, which
bypasses RLS entirely). RLS answers a yes/no question well
(`is_admin()`/`is_owner()`); it's the wrong tool for "was this specific
role-escalation attempt legitimate."

Instead, every admin-management API route (`/api/admin/*`) does this in
order:
1. Read the caller's session from cookies (`lib/supabase/server.ts`).
2. Look up the caller's own `admin_users` row to get their real role/status
   — never trust a role claimed in the request body.
3. Reject if the caller isn't authorized for this specific action.
4. Only then perform the write, using a `service_role` client.

## Bootstrapping the first Owner

`admin_users` has no client-write path, so the first row can't be created
through the app — same as Django's `createsuperuser` or a Rails seed
script. One-time, run once against the live project:

```bash
cd admin && node scripts/bootstrap-owner.mjs "person@example.com"
```

This creates the Supabase Auth user (or reuses one if it already exists)
and inserts the matching `admin_users` row with `role = 'owner'`. Requires
`SUPABASE_SERVICE_ROLE_KEY` in the environment — never run this against a
project you don't control.

## Login flow

- New admin gets an email (Supabase's `inviteUserByEmail`, triggered by
  `/api/admin/invite`), clicks through, sets a password.
- Forgot password: `/login` → "Forgot password?" → `/forgot-password` → email
  with a link (Supabase's `resetPasswordForEmail`). Same mechanism as the
  invite link, same destination page — `/set-password`'s copy stays generic
  because there's no reliable way to tell which flow sent someone there.
- From then on: `/login`, email + password.
- No 2FA. Real security value, but real complexity for a trusted 3-person
  team on a deadline — easy to add later if the team grows.
- Session handling (refresh tokens, cookie storage) is entirely
  `@supabase/ssr` + `admin/proxy.ts` (Next.js 16 renamed `middleware.ts`),
  the standard Next.js App Router pattern — nothing custom.

### Why invite/reset links go through `/auth/confirm`, not straight to `/set-password`

Neither the proxy nor `@supabase/ssr`'s browser client turns an invite/reset
link's token into a real session just by loading a page with it in the URL —
that's only true of the old implicit flow. The current default requires an
explicit exchange first: `admin/app/auth/confirm/route.ts` does that
server-side (`verifyOtp` for a `token_hash`+`type` link, or
`exchangeCodeForSession` for a `code` link — it isn't this app's choice
which one Supabase sends, that's project-level email template config), sets
the session cookie, then redirects to `next` (`/set-password`). Every
`redirectTo` in this codebase points at `/auth/confirm?next=...`, never
directly at the destination page, for this reason.

### Required Supabase dashboard configuration

Invite/reset links redirect through the project's **Site URL**, which is
dashboard config (Authentication → URL Configuration), not something an API
call can override per-request — `redirectTo` only works for destinations
already on the **Redirect URLs** allowlist there. `supabase/config.toml`
documents the intended local-dev values (`site_url = "http://localhost:3000"`,
`http://localhost:3000/**` in `additional_redirect_urls`), but that file is
**not** synced to the live project automatically — `supabase config push`
would need to be run deliberately, and it pushes the whole config, not just
these two fields. Until then, set both by hand in the dashboard to match, or
invite/reset links will land wherever the project's default Site URL is
instead of `/auth/confirm`.

### Email sending is rate-limited until a custom SMTP provider is configured

Every Supabase project starts on a shared, heavily-throttled default email
sender meant only for testing — a handful of invites/resets in quick
succession is enough to hit "email rate limit exceeded." This isn't a bug
in this app; every `auth.admin.inviteUserByEmail`/`resetPasswordForEmail`
call goes through it until it's replaced. Before relying on invite/reset
emails for real use (not just testing), configure a real provider under
Project Settings → Authentication → SMTP Settings — Resend, SendGrid, and
Postmark all have free tiers well above what a 3-person admin panel needs.

## Entry point on the public site

The admin panel is a separate app on a separate domain — a link on the
public site just navigates away, it never renders a login form in front of
a regular visitor. One small, low-contrast footer link, labeled **"Staff
Login"** (not "Login" — that would imply visitors have accounts of their
own), no header/nav placement.
