import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { email, role, fullName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

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
    // so it must come from a real Auth user -- inviteUserByEmail must
    // succeed before there's anything to insert.
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (authErr || !authData?.user) {
      return NextResponse.json(
        { error: `Failed to invite user via Supabase Auth: ${authErr?.message || "no user returned"}` },
        { status: 500 },
      );
    }
    const authUser = authData.user;

    const newUser = {
      id: authUser.id,
      email,
      full_name: fullName || email.split("@")[0],
      role: role || "admin",
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
      message: `Invitation successfully sent and recorded for ${email}`,
      user: inserted,
    });
  } catch (err: any) {
    console.error("Invite API error:", err);
    return NextResponse.json({ error: err.message || "Failed to send invitation" }, { status: 500 });
  }
}
