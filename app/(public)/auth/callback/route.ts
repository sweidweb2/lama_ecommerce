import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/supabase";
import { ROUTES } from "@/lib/constants/routes";
import { ROLES } from "@/lib/constants/roles";
import { getCurrentUserProfile } from "@/services/profile.service";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeRedirectPath(
    requestUrl.searchParams.get("next"),
    ROUTES.HOME,
  );

  if (code) {
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user is admin and redirect accordingly
      try {
        const profile = await getCurrentUserProfile();
        if (profile?.role === ROLES.ADMIN) {
          const adminUrl = new URL(ROUTES.ADMIN, requestUrl.origin);
          return NextResponse.redirect(adminUrl);
        }
      } catch (error) {
        // If profile check fails, continue with normal redirect
        console.error("Failed to check user role in callback:", error);
      }

      return response;
    }
  }

  // Return the user to login page with error message
  const loginUrl = new URL(ROUTES.LOGIN, requestUrl.origin);
  loginUrl.searchParams.set("error", "auth_callback_error");
  return NextResponse.redirect(loginUrl);
}
