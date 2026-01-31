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
  // These routes are accessible to everyone
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/api");

  if (isPublicRoute) {
    // Storefront routes - public, no protection needed
    // Only check session when needed (e.g., for cart/wishlist) - handled in components
    return NextResponse.next();
  }

  // Account routes - require authenticated user (any role)
  if (pathname.startsWith("/account")) {
    const { profile, user, response } = await getProfileFromSession(request);

    if (!user || !profile) {
      // Redirect to login if not authenticated
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated, allow access
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
