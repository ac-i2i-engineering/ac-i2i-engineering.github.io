import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

// Skips the form only for a real active admin -- not just "has a Supabase
// session" (see proxy.ts for why that distinction matters: a suspended
// admin or an orphaned Auth user has a session but isn't one).
export default async function LoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/");
  }

  return <LoginForm />;
}
