import { NextResponse } from "next/server";
import { getWishlistCountForSession } from "@/services/wishlist.service";
import { resolveStorefrontSession } from "@/lib/auth/session-context";

/**
 * GET /api/wishlist/count
 * Navbar badge count. API route avoids Server Action soft-refresh on navigation.
 */
export async function GET() {
  try {
    const session = await resolveStorefrontSession();
    if (!session) {
      return NextResponse.json({ count: 0 });
    }

    const count = await getWishlistCountForSession(session);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error in GET /api/wishlist/count:", error);
    return NextResponse.json({ count: 0 });
  }
}
