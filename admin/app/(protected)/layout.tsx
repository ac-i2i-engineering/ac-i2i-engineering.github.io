import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { SessionProvider } from "@/lib/auth/SessionContext";
import { AdminLayout } from "@/components/AdminLayout";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <AdminLayout user={session}>{children}</AdminLayout>
    </SessionProvider>
  );
}
