"use client";

import { createContext, useContext } from "react";
import type { AdminSession } from "./session";

const SessionContext = createContext<AdminSession | null>(null);

export function SessionProvider({
  session,
  children,
}: {
  session: AdminSession;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

/** Client-side access to the signed-in admin's session, e.g. for role-gated UI. */
export function useAdminSession(): AdminSession {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useAdminSession must be used within app/(protected) -- no session in context");
  }
  return session;
}
