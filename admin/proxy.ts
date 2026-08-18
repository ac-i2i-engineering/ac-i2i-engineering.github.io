import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Standard Supabase SSR proxy (Next.js 16 renamed "middleware" to "proxy" --
// same file conventions otherwise): refreshes the session cookie on every
// request (required so sessions don't silently expire) and redirects
// requests with no Supabase session at all away from protected routes.
//
// Deliberately does NOT redirect an authenticated user away from /login --
// "has a Supabase session" is not the same as "is an active admin" (a
// suspended admin, or an orphaned Auth user with no admin_users row, has
// the former but not the latter), and this layer has no cheap way to check
// the latter without a DB round trip on every request. /login does that
// real check itself via getAdminSession() before rendering the form, same
// as app/(protected)/layout.tsx does for every protected page. Redirecting
// from here on "has a session" alone previously caused an infinite loop:
// (protected)/layout.tsx sends a non-admin session to /login, this proxy
// immediately bounced them back to /, forever.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/set-password") ||
    request.nextUrl.pathname.startsWith("/forgot-password") ||
    request.nextUrl.pathname.startsWith("/auth/confirm");

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
