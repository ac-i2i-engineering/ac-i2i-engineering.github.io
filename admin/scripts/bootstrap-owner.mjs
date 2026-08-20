#!/usr/bin/env node
// One-time bootstrap for the very first admin_users row. admin_users has no
// client-write path at all (see docs/SCHEMA.md), so the first Owner can't be
// created through the app -- same reason Django ships `createsuperuser` and
// Rails ships seed scripts. Every Owner/Admin after this one is created
// through the app's "invite" flow instead (a temp password, not email).
//
// Sets a real password directly at creation -- no invite email involved, so
// bootstrapping doesn't depend on Supabase's email sending at all. You'll be
// prompted for the password interactively.
//
// Usage:
//   cd admin
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/bootstrap-owner.mjs "you@example.com"
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
// environment (the same values as admin/.env.local). Never run this against
// a project you don't control -- it bypasses every RLS policy.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import path from "node:path";

function loadDotEnvLocal() {
  try {
    const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
    const contents = readFileSync(envPath, "utf8");
    for (const line of contents.split("\n")) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match && !(match[1] in process.env)) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // .env.local not present -- fine, rely on already-exported env vars.
  }
}

loadDotEnvLocal();

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/bootstrap-owner.mjs "you@example.com"');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existing } = await supabase.from("admin_users").select("id, role").eq("email", email).maybeSingle();
if (existing) {
  console.error(`admin_users already has a row for ${email} (role: ${existing.role}). Nothing to do.`);
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const password = await rl.question("Set a password for this Owner account (min 8 characters): ");
rl.close();

if (!password || password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const { data: created, error: createErr } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (createErr || !created?.user) {
  console.error("Failed to create user via Supabase Auth:", createErr?.message ?? "no user returned");
  process.exit(1);
}

const { error: insertErr } = await supabase.from("admin_users").insert([
  {
    id: created.user.id,
    email,
    role: "owner",
    status: "active",
    must_reset_password: false,
  },
]);

if (insertErr) {
  console.error("Auth user created, but inserting into admin_users failed:", insertErr.message);
  process.exit(1);
}

console.log(`Owner bootstrapped: ${email}. Sign in at /login with the password you just set.`);
