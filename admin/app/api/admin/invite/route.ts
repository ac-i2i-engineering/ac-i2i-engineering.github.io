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

    let authUser = null;
    try {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
      if (!authErr && authData?.user) {
        authUser = authData.user;
      }
    } catch (e) {
      console.warn("Supabase Auth invite skipped:", e);
    }

    const newUser = {
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
      user: {
        id: authUser?.id ?? inserted.id,
        ...newUser,
      },
    });
  } catch (err: any) {
    console.error("Invite API error:", err);
    return NextResponse.json({ error: err.message || "Failed to send invitation" }, { status: 500 });
  }
}
