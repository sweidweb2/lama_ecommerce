import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import { trackProductViewService } from "@/services/product_view.service";
import {
  getGuestSessionId,
  getOrCreateGuestSessionId,
} from "@/lib/auth/guest-session";

const bodySchema = z.object({
  productId: z.string().uuid(),
});

/**
 * POST /api/product-views
 * Fire-and-forget product view tracking.
 * Must be an API route (not a Server Action) so completing the request
 * does not soft-refresh the PDP RSC tree and reset scroll.
 */
export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID" },
        { status: 400 },
      );
    }

    const user = await getCurrentAuthUserFromAction();
    let userId: string | null = null;
    let sessionId: string | null = null;

    if (user) {
      userId = user.id;
    } else {
      sessionId =
        (await getGuestSessionId()) ?? (await getOrCreateGuestSessionId());
    }

    const result = await trackProductViewService(
      parsed.data.productId,
      userId,
      sessionId,
    );

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Error in POST /api/product-views:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to track product view",
      },
      { status: 500 },
    );
  }
}
