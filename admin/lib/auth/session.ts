import { createClient } from "@/lib/supabase/server";
import type { AdminUser } from "@/lib/types";

export interface AdminSession {
  userId: string;
  email: string;
  admin: AdminUser;
}

/**
 * Server-side only. Returns null if there's no session, or if the signed-in
 * user has no active admin_users row -- a valid Supabase Auth session alone
 * is not enough, it must also be a real (and active, not suspended) admin.
 *
 * Relies on RLS: the caller can only ever see their own admin_users row this
 * way if `is_admin()` allows it, so this doubles as the authorization check,
 * not just a lookup.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: admin } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!admin) return null;

  return { userId: user.id, email: user.email ?? admin.email, admin };
}

export function isOwner(session: AdminSession | null): boolean {
  return session?.admin.role === "owner";
}
