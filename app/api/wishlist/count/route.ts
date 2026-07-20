import { NextResponse } from "next/server";
import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import {
  getWishlistCount,
  getWishlistCountForGuest,
} from "@/services/wishlist.service";
import { getGuestSessionId } from "@/lib/auth/guest-session";

/**
 * GET /api/wishlist/count
 * Navbar badge count. API route avoids Server Action soft-refresh on navigation.
 */
export async function GET() {
  try {
    const user = await getCurrentAuthUserFromAction();
    if (user) {
      const count = await getWishlistCount(user.id);
      return NextResponse.json({ count });
    }

    const sessionId = await getGuestSessionId();
    if (!sessionId) {
      return NextResponse.json({ count: 0 });
    }

    const count = await getWishlistCountForGuest(sessionId);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error in GET /api/wishlist/count:", error);
    return NextResponse.json({ count: 0 });
  }
}
