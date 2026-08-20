import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { getAdminSession } from "@/lib/auth/session";

// Not sent anywhere -- returned once in this route's response so the
// inviting admin can copy it and share it out-of-band (Slack, in person).
// Avoids depending on Supabase's own email sending for onboarding, which is
// rate-limited to a couple of emails/hour on the default sender. Self-service
// "Forgot password" (email-based) is kept as the recovery path for later, so
// there's no single point of failure if the inviting admin isn't reachable.
function generateTempPassword(): string {
  return randomBytes(9).toString("base64url"); // 12 chars, well past the 8-char minimum
}

export async function POST(request: Request) {
  try {
    // Any active admin (Owner or Admin) may invite -- but only an Owner may
    // grant Owner. Never trust the requested role from an unprivileged
    // caller; see docs/AUTH.md.
    const caller = await getAdminSession();
    if (!caller) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { email, role, fullName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const resolvedRole = role === "owner" && caller.admin.role === "owner" ? "owner" : "admin";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 },
      );
    }

    // service_role bypasses RLS -- required here, since admin_users has no
    // insert policy at all for anon/authenticated (see docs/SCHEMA.md).
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // admin_users.id is a PK that references auth.users(id) with no default,
    // so it must come from a real Auth user -- this must succeed before
    // there's anything to insert.
    const tempPassword = generateTempPassword();
    let authUser: { id: string };

    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (!authErr && authData?.user) {
      authUser = authData.user;
    } else if (authErr?.code === "email_exists" || /already (been )?registered|already exists/i.test(authErr?.message ?? "")) {
      // An Auth user for this email already exists -- most likely someone
      // invited before this flow existed (the old inviteUserByEmail left a
      // half-set-up Auth user with no password and no admin_users row).
      // Reuse it, but only if it isn't already a real admin: resetting an
      // existing admin's password here would be a silent account takeover.
      const { data: existingAdminRow } = await supabaseAdmin
        .from("admin_users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (existingAdminRow) {
        return NextResponse.json({ error: `${email} is already an admin` }, { status: 409 });
      }

      const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (listErr || !existingAuthUser) {
        return NextResponse.json(
          { error: `Failed to look up existing Auth user: ${listErr?.message || "not found"}` },
          { status: 500 },
        );
      }

      const { data: updated, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        { password: tempPassword, email_confirm: true },
      );
      if (updateErr || !updated?.user) {
        return NextResponse.json(
          { error: `Failed to reset existing Auth user: ${updateErr?.message || "no user returned"}` },
          { status: 500 },
        );
      }
      authUser = updated.user;
    } else {
      return NextResponse.json(
        { error: `Failed to create user via Supabase Auth: ${authErr?.message || "no user returned"}` },
        { status: 500 },
      );
    }

    const newUser = {
      id: authUser.id,
      email,
      full_name: fullName || email.split("@")[0],
      role: resolvedRole,
      status: "active" as const,
      must_reset_password: true,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error: dbErr } = await supabaseAdmin
      .from("admin_users")
      .insert([newUser])
      .select()
      .single();

    if (dbErr) {
      return NextResponse.json({ error: `Failed to add admin_users row: ${dbErr.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Admin account created for ${email}`,
      user: inserted,
      tempPassword,
    });
  } catch (err) {
    console.error("Invite API error:", err);
    const message = err instanceof Error ? err.message : "Failed to send invitation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
