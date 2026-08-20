import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { SessionProvider } from "@/lib/auth/SessionContext";
import { AdminLayout } from "@/components/AdminLayout";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  // Invited via a temp password (see /api/admin/invite) -- must set a real
  // one before reaching anything else. /set-password isn't under this
  // layout, so this doesn't loop.
  if (session.admin.must_reset_password) {
    redirect("/set-password");
  }

  return (
    <SessionProvider session={session}>
      <AdminLayout user={session}>{children}</AdminLayout>
    </SessionProvider>
  );
}
