import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Lets a signed-in admin update their own display name / avatar. Scoped to
// the caller's own row only, taken from their session, never from the
// request body -- admin_users has no client-write RLS policy at all, same
// reasoning as /api/account/clear-must-reset.
export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { full_name, avatar_url } = await request.json();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 },
    );
  }

  const supabaseAdmin = createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const updates: Record<string, string | null> = {};
  if (typeof full_name === "string") updates.full_name = full_name.trim() || null;
  if (typeof avatar_url === "string" || avatar_url === null) updates.avatar_url = avatar_url;

  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: data });
}
