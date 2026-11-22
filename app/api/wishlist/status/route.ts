import { NextResponse } from "next/server";
import { createWishlistItemSchema } from "@/lib/validators/wishlist/create";
import { checkIfInWishlistForSession } from "@/services/wishlist.service";
import { resolveStorefrontSession } from "@/lib/auth/session-context";

/**
 * GET /api/wishlist/status?customised_product_id=
 * PDP heart state. API route avoids Server Action soft-refresh on variant select.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customisedProductId = searchParams.get("customised_product_id");
    const validation = createWishlistItemSchema.safeParse({
      customised_product_id: customisedProductId,
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, inWishlist: false, error: "Invalid product variant ID" },
        { status: 400 },
      );
    }

    const session = await resolveStorefrontSession();
    if (!session) {
      return NextResponse.json({ success: true, inWishlist: false });
    }

    const inWishlist = await checkIfInWishlistForSession(
      session,
      validation.data.customised_product_id,
    );
    return NextResponse.json({ success: true, inWishlist });
  } catch (error) {
    console.error("Error in GET /api/wishlist/status:", error);
    return NextResponse.json({
      success: false,
      inWishlist: false,
      error: "Failed to check wishlist status",
    });
  }
}
