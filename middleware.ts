import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { ROLES } from "@/lib/constants/roles";
import { ROUTES } from "@/lib/constants/routes";
import {
  GUEST_SESSION_COOKIE,
} from "@/lib/auth/guest-session.constants";
import { resolveGuestSessionCookie } from "@/lib/auth/apply-guest-session-cookie";
import type { Profile } from "@/types/user";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Ensure a guest_session_id cookie exists on storefront routes.
 * Valid cookies are rewritten to slide maxAge; missing/invalid cookies are minted.
 * Doing this here avoids Server Actions writing cookies later (which soft-refresh RSC pages).
 */
function ensureGuestSessionCookie(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const existing = request.cookies.get(GUEST_SESSION_COOKIE)?.value;
  const decision = resolveGuestSessionCookie(existing);
  response.cookies.set(GUEST_SESSION_COOKIE, decision.value, decision.options);
  return response;
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

/**
 * Sign out inactive session and redirect to login with reason=inactive.
 */
async function rejectInactiveHtml(
  request: NextRequest,
  supabase: SupabaseClient<Database>,
  sessionResponse: NextResponse,
): Promise<NextResponse> {
  await supabase.auth.signOut();
  const loginUrl = new URL(ROUTES.LOGIN, request.url);
  loginUrl.searchParams.set("reason", "inactive");
  const redirectResponse = NextResponse.redirect(loginUrl);
  copyCookies(sessionResponse, redirectResponse);
  return redirectResponse;
}

/**
 * Sign out inactive session and return JSON 403 for admin APIs.
 */
async function rejectInactiveApi(
  supabase: SupabaseClient<Database>,
  sessionResponse: NextResponse,
): Promise<NextResponse> {
  await supabase.auth.signOut();
  const jsonResponse = NextResponse.json(
    { error: "Account inactive" },
    { status: 403 },
  );
  copyCookies(sessionResponse, jsonResponse);
  return jsonResponse;
}

/**
 * Middleware helper: Get the current user's profile and role from session.
 * Returns supabase so inactive handling can sign out on the same client.
 */
async function getProfileFromSession(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { profile: null, user: null, response, supabase };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { profile: null, user, response, supabase };
  }

  return {
    profile: profile as Profile,
    user,
    response,
    supabase,
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes — explicit policy (JSON for admin APIs, not HTML redirects)
  if (pathname.startsWith("/api")) {
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/admin")) {
      const { profile, user, response, supabase } =
        await getProfileFromSession(request);

      if (!user || !profile) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (!profile.is_active) {
        return rejectInactiveApi(supabase, response);
      }

      if (profile.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return response;
    }

    // Other /api/* — allow for now
    return NextResponse.next();
  }

  // Logged-in users cannot open login / signup until they log out
  const isAuthEntryPage =
    pathname === ROUTES.LOGIN ||
    pathname === ROUTES.SIGNUP ||
    pathname.startsWith(`${ROUTES.LOGIN}/`) ||
    pathname.startsWith(`${ROUTES.SIGNUP}/`);

  if (isAuthEntryPage) {
    const { profile, user, response } = await getProfileFromSession(request);
    if (user && profile?.is_active) {
      const destination =
        profile.role === ROLES.ADMIN ? ROUTES.ADMIN : ROUTES.HOME;
      const redirectResponse = NextResponse.redirect(
        new URL(destination, request.url),
      );
      // Preserve any session cookies refreshed by getProfileFromSession
      copyCookies(response, redirectResponse);
      return redirectResponse;
    }
    return ensureGuestSessionCookie(request, response);
  }

  // Public routes - no protection needed (storefront, other auth pages, etc.)
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/search");

  if (isPublicRoute) {
    return ensureGuestSessionCookie(request, NextResponse.next());
  }

  // Cart — guests and customers only; admins are redirected to the panel
  if (pathname.startsWith("/cart")) {
    const { profile, user, response } = await getProfileFromSession(request);
    if (user && profile?.is_active && profile.role === ROLES.ADMIN) {
      const redirectResponse = NextResponse.redirect(
        new URL(ROUTES.ADMIN, request.url),
      );
      copyCookies(response, redirectResponse);
      return redirectResponse;
    }
    return ensureGuestSessionCookie(request, NextResponse.next());
  }

  // Wishlist — guests and customers only; admins are redirected to the panel
  if (pathname.startsWith("/wishlist")) {
    const { profile, user, response } = await getProfileFromSession(request);
    if (user && profile?.is_active && profile.role === ROLES.ADMIN) {
      const redirectResponse = NextResponse.redirect(
        new URL(ROUTES.ADMIN, request.url),
      );
      copyCookies(response, redirectResponse);
      return redirectResponse;
    }
    return ensureGuestSessionCookie(request, NextResponse.next());
  }

  // Guest order history / details — mint cookie on cold hits (does not recover expired sessions)
  if (
    pathname.startsWith("/orders") ||
    pathname.startsWith("/order_details")
  ) {
    return ensureGuestSessionCookie(request, NextResponse.next());
  }

  // Account routes - require authenticated user with active profile
  if (pathname.startsWith("/account")) {
    const { profile, user, response, supabase } =
      await getProfileFromSession(request);

    if (!user || !profile) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!profile.is_active) {
      return rejectInactiveHtml(request, supabase, response);
    }

    return response;
  }

  // Profile routes - only the profile owner (logged-in user) or an admin may access
  // /profile and /profile/setting always show the current user's own profile
  if (pathname.startsWith("/profile")) {
    const { profile, user, response, supabase } =
      await getProfileFromSession(request);

    if (!user || !profile) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!profile.is_active) {
      return rejectInactiveHtml(request, supabase, response);
    }

    return response;
  }

  // Admin routes - require active admin role
  if (pathname.startsWith("/admin")) {
    const { profile, user, response, supabase } =
      await getProfileFromSession(request);

    if (!user || !profile) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!profile.is_active) {
      return rejectInactiveHtml(request, supabase, response);
    }

    if (profile.role !== ROLES.ADMIN) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  }

  // Default: allow access (for any other routes)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public image files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
