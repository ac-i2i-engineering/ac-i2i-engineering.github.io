import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Where invite (inviteUserByEmail) and reset (resetPasswordForEmail) links
// actually land. Neither @supabase/ssr's browser client nor the proxy
// establishes a session just from loading a page with a token in the URL --
// that only happens for the old implicit flow. The current default requires
// exchanging the token server-side first, which is what this route does,
// before forwarding to `next` (set-password) with a real session cookie set.
//
// Handles both link shapes Supabase might send, since which one depends on
// project-level email template config, not anything this app controls:
//   - token_hash + type  -> auth.verifyOtp()      (current default template)
//   - code                -> auth.exchangeCodeForSession()  (PKCE)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/set-password";

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("verifyOtp failed:", error.message);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("exchangeCodeForSession failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=invalid-or-expired-link`);
}
