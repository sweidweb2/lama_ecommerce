import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/supabase";
import { ROUTES } from "@/lib/constants/routes";
import { ROLES } from "@/lib/constants/roles";
import { getProfileByUserIdAdmin } from "@/repositories/profile.repository";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { GUEST_SESSION_COOKIE } from "@/lib/auth/guest-session.constants";
import { performGuestSessionHandoff } from "@/actions/cart";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function redirectWithCookies(
  url: URL,
  cookiesToSet: CookieToSet[],
): NextResponse {
  const response = NextResponse.redirect(url);
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeRedirectPath(
    requestUrl.searchParams.get("next"),
    ROUTES.HOME,
  );

  if (code) {
    const cookiesToSet: CookieToSet[] = [];

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(toSet) {
            toSet.forEach(({ name, value, options }) => {
              cookiesToSet.push({ name, value, options });
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Guest handoff while guest_session_id is still on the request.
      // Use the exchange-client user — auth cookies live on the redirect response,
      // so mergeGuestCartOnLoginAction's getUser would miss the new session.
      // Failures are non-blocking; cookie stays for AuthProvider retry.
      let exchangedUserId: string | null = null;
      let exchangedUserEmail: string | null = null;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        exchangedUserId = user?.id ?? null;
        exchangedUserEmail = user?.email ?? null;

        if (exchangedUserId) {
          const handoff = await performGuestSessionHandoff(
            exchangedUserId,
            exchangedUserEmail,
          );
          if (!handoff.success) {
            console.error(
              "Guest session handoff failed in auth callback:",
              handoff.error,
            );
          } else if (handoff.clearedGuestCookie) {
            // redirectWithCookies builds a fresh response — expire guest cookie on it too
            cookiesToSet.push({
              name: GUEST_SESSION_COOKIE,
              value: "",
              options: {
                path: "/",
                maxAge: 0,
                httpOnly: true,
                sameSite: "lax",
              },
            });
          }
        }
      } catch (handoffError) {
        console.error(
          "Guest session handoff failed in auth callback:",
          handoffError,
        );
      }

      // Honor explicit next (e.g. password-reset confirm). Admin home redirect
      // only applies when the email link did not request a specific destination.
      let destination = next;
      const hasExplicitNext = !!requestUrl.searchParams.get("next");
      if (!hasExplicitNext && exchangedUserId) {
        try {
          const profile = await getProfileByUserIdAdmin(exchangedUserId);
          if (profile?.role === ROLES.ADMIN) {
            destination = ROUTES.ADMIN_HOME;
          }
        } catch (profileError) {
          console.error("Failed to check user role in callback:", profileError);
        }
      }

      return redirectWithCookies(
        new URL(destination, requestUrl.origin),
        cookiesToSet,
      );
    }
  }

  // Return the user to login page with error message
  const loginUrl = new URL(ROUTES.LOGIN, requestUrl.origin);
  loginUrl.searchParams.set("error", "auth_callback_error");
  return NextResponse.redirect(loginUrl);
}
