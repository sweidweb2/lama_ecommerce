import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { ROLES } from "@/lib/constants/roles";
import { ROUTES } from "@/lib/constants/routes";
import type { Profile } from "@/types/user";

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
  const { data: profile, error: profileError } = await (supabase as any)
    .from("profiles" as any)
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

  // Public routes - no protection needed (storefront, auth pages, etc.)
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/api");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Cart - accessible by both authenticated users and guests
  if (pathname.startsWith("/cart")) {
    return NextResponse.next();
  }

  // Wishlist - only the authenticated user can access their own
  if (pathname.startsWith("/wishlist")) {
    const { profile, user, response } = await getProfileFromSession(request);

    if (!user || !profile) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (profile.deleted_at) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set("reason", "inactive");
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // Account routes - require authenticated user with active profile
  if (pathname.startsWith("/account")) {
    const { profile, user, response } = await getProfileFromSession(request);

    if (!user || !profile) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Inactive (soft-deleted) users cannot access account
    if (profile.deleted_at) {
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

    // Inactive (soft-deleted) users cannot access profile
    if (profile.deleted_at) {
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
