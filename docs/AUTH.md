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

You'll be prompted for a password interactively. The script creates the
Supabase Auth user with that password directly (`email_confirm: true`, no
invite email involved) and inserts the matching `admin_users` row with
`role = 'owner'`, `must_reset_password = false`. Requires
`SUPABASE_SERVICE_ROLE_KEY` in the environment — never run this against a
project you don't control.

## Login flow

- **Bootstrapping the first Owner**: no email at all — `bootstrap-owner.mjs`
  sets a real password directly (see above). They sign in at `/login`
  immediately.
- **Inviting a new admin**: `/api/admin/invite` creates the Supabase Auth
  user directly with a random temporary password (`auth.admin.createUser`,
  not `inviteUserByEmail`) and sets `admin_users.must_reset_password = true`.
  The temp password is returned once in the API response and shown once in
  the Settings UI, for the inviting admin to share out-of-band (Slack, text,
  in person) — **not email**. The new admin signs in at `/login` with that
  temp password like anyone else; `(protected)/layout.tsx` sees
  `must_reset_password` and redirects them to `/set-password` before they
  can reach anything else. Setting a real password there clears the flag
  (`/api/account/clear-must-reset`, scoped to the caller's own row).
  Deliberately not email-based: onboarding several admins in a short window
  is exactly the pattern that hits Supabase's default sender's rate limit,
  and the old invite-link flow depended on the browser establishing a
  session purely from a URL token, which isn't how the current flow actually
  works (see below) — signing in with a real password sidesteps both.
- **Forgot password** (for an existing admin who's already set a real
  password): `/login` → "Forgot password?" → `/forgot-password` → email with
  a link (Supabase's `resetPasswordForEmail`), same `/auth/confirm` →
  `/set-password` mechanism as before. Kept as self-service and email-based
  on purpose — an admin-issued reset would mean anyone locked out depends on
  another admin being reachable, a single point of failure for a 3-person
  team. Used far less often than invites, so it's much less likely to hit
  the rate limit in practice; still worth a real SMTP provider (see below)
  before relying on it for anything time-sensitive.
- From then on: `/login`, email + password.
- No 2FA. Real security value, but real complexity for a trusted 3-person
  team on a deadline — easy to add later if the team grows.
- Session handling (refresh tokens, cookie storage) is entirely
  `@supabase/ssr` + `admin/proxy.ts` (Next.js 16 renamed `middleware.ts`),
  the standard Next.js App Router pattern — nothing custom.

### Why the forgot-password link goes through `/auth/confirm`, not straight to `/set-password`

Neither the proxy nor `@supabase/ssr`'s browser client turns a reset link's
token into a real session just by loading a page with it in the URL — that's
only true of the old implicit flow. The current default requires an explicit
exchange first: `admin/app/auth/confirm/route.ts` does that server-side
(`verifyOtp` for a `token_hash`+`type` link, or `exchangeCodeForSession` for
a `code` link — it isn't this app's choice which one Supabase sends, that's
project-level email template config), sets the session cookie, then
redirects to `next` (`/set-password`). This is exactly the failure mode the
temp-password invite flow above was built to avoid entirely for onboarding:
a user who reaches `/set-password` via a forced redirect after signing in
with a temp password already has a real session from `signInWithPassword`,
no token-exchange step needed.

### Required Supabase dashboard configuration

The forgot-password link redirects through the project's **Site URL**, which
is dashboard config (Authentication → URL Configuration), not something an
API call can override per-request — `redirectTo` only works for
destinations already on the **Redirect URLs** allowlist there.
`supabase/config.toml` documents the intended local-dev values
(`site_url = "http://localhost:3000"`, `http://localhost:3000/**` in
`additional_redirect_urls`), but that file is **not** synced to the live
project automatically — `supabase config push` would need to be run
deliberately, and it pushes the whole config, not just these two fields.
Until then, set both by hand in the dashboard to match, or the reset link
will land wherever the project's default Site URL is instead of
`/auth/confirm`.

### Email sending is rate-limited until a custom SMTP provider is configured

Every Supabase project starts on a shared, heavily-throttled default email
sender meant only for testing — a handful of emails in quick succession is
enough to hit "email rate limit exceeded." This isn't a bug in this app;
every `auth.resetPasswordForEmail` call goes through it until it's replaced.
Bootstrapping and inviting no longer send any email at all (see Login flow
above), so this now only affects forgot-password. Before relying on it for
real use (not just testing), configure a real provider under Project
Settings → Authentication → SMTP Settings — Resend, SendGrid, and Postmark
all have free tiers well above what a 3-person admin panel needs. Note that
a personal Gmail account doesn't work well as a substitute SMTP provider —
Supabase's own dashboard warns about this, since consumer Gmail isn't meant
for automated/transactional sending and Google may throttle or flag it
regardless of whether the credentials are correct.

## Entry point on the public site

The admin panel is a separate app on a separate domain — a link on the
public site just navigates away, it never renders a login form in front of
a regular visitor. One small, low-contrast footer link, labeled **"Staff
Login"** (not "Login" — that would imply visitors have accounts of their
own), no header/nav placement.
