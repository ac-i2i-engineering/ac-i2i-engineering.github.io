import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSession, isOwner } from "@/lib/auth/session";

function serviceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Server is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Refuses to leave the system with zero active Owners -- see docs/AUTH.md.
async function wouldRemoveLastOwner(
  admin: ReturnType<typeof serviceClient>,
  targetId: string,
): Promise<boolean> {
  const { data: target } = await admin.from("admin_users").select("role").eq("id", targetId).single();
  if (target?.role !== "owner") return false;

  const { count } = await admin
    .from("admin_users")
    .select("*", { count: "exact", head: true })
    .eq("role", "owner")
    .eq("status", "active");

  return (count ?? 0) <= 1;
}

// PATCH: suspend or reactivate. Owner-only.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const caller = await getAdminSession();
  if (!caller) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!isOwner(caller)) {
    return NextResponse.json({ error: "Only an Owner can suspend or reactivate an admin" }, { status: 403 });
  }

  const { status } = await request.json();
  if (status !== "active" && status !== "suspended") {
    return NextResponse.json({ error: "status must be 'active' or 'suspended'" }, { status: 400 });
  }

  const admin = serviceClient();

  if (status === "suspended" && (await wouldRemoveLastOwner(admin, id))) {
    return NextResponse.json({ error: "Can't suspend the last remaining active Owner" }, { status: 400 });
  }

  const { data, error } = await admin.from("admin_users").update({ status }).eq("id", id).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: data });
}

// DELETE: permanent. Owner-only.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const caller = await getAdminSession();
  if (!caller) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!isOwner(caller)) {
    return NextResponse.json({ error: "Only an Owner can delete an admin" }, { status: 403 });
  }

  const admin = serviceClient();

  if (await wouldRemoveLastOwner(admin, id)) {
    return NextResponse.json({ error: "Can't delete the last remaining active Owner" }, { status: 400 });
  }

  const { error: dbErr } = await admin.from("admin_users").delete().eq("id", id);
  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  // Also remove the underlying Auth user so they can no longer sign in at
  // all, not just fail the admin_users check.
  const { error: authErr } = await admin.auth.admin.deleteUser(id);
  if (authErr) {
    console.warn(`admin_users row for ${id} deleted, but Auth user deletion failed:`, authErr.message);
  }

  return NextResponse.json({ success: true });
}
