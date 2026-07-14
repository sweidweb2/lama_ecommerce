import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { ROLES } from "@/lib/constants/roles";
import { ROUTES } from "@/lib/constants/routes";
import type { Profile } from "@/types/user";

/** Keep in sync with `lib/auth/guest-session.ts` (do not import that file here — it uses next/headers). */
const GUEST_SESSION_COOKIE = "guest_session_id";
const GUEST_SESSION_MAX_AGE = 14 * 24 * 60 * 60;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ensure a guest_session_id cookie exists on storefront routes.
 * Minting here avoids Server Actions writing cookies later (which soft-refresh RSC pages).
 */
function ensureGuestSessionCookie(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const existing = request.cookies.get(GUEST_SESSION_COOKIE)?.value;
  if (existing && UUID_RE.test(existing)) {
    return response;
  }

  response.cookies.set(GUEST_SESSION_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: GUEST_SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}

/**
 * Middleware helper: Get the current user's profile and role from session.
 * Returns { profile, user } or { profile: null, user: null } if not authenticated.
 */
async function getProfileFromSession(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { profile: null, user: null, response };
  }

  // Fetch profile from database
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { profile: null, user, response };
  }

  return {
    profile: profile as Profile,
    user,
    response,
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
      const { profile, user, response } = await getProfileFromSession(request);

      if (!user || !profile) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
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

  // Cart - accessible by both authenticated users and guests
  if (pathname.startsWith("/cart")) {
    return ensureGuestSessionCookie(request, NextResponse.next());
  }

  // Wishlist - accessible by both authenticated users and guests
  if (pathname.startsWith("/wishlist")) {
    return ensureGuestSessionCookie(request, NextResponse.next());
  }

  // Account routes - require authenticated user with active profile
  if (pathname.startsWith("/account")) {
    const { profile, user, response } = await getProfileFromSession(request);

    if (!user || !profile) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Inactive users cannot access account
    if (!profile.is_active) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set("reason", "inactive");
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // Profile routes - only the profile owner (logged-in user) or an admin may access
  // /profile and /profile/setting always show the current user's own profile
  if (pathname.startsWith("/profile")) {
    const { profile, user, response } = await getProfileFromSession(request);

    if (!user || !profile) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Inactive users cannot access profile
    if (!profile.is_active) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set("reason", "inactive");
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated user (owner) or admin - allow access to their own profile
    return response;
  }

  // Admin routes - require admin role
  if (pathname.startsWith("/admin")) {
    const { profile, user, response } = await getProfileFromSession(request);

    if (!user || !profile) {
      // Not authenticated, redirect to login
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has admin role using ROLES constant
    if (profile.role !== ROLES.ADMIN) {
      // Not an admin, redirect to home or unauthorized page
      return NextResponse.redirect(new URL("/", request.url));
    }

    // User is admin, allow access
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
