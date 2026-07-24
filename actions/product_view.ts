"use server";

import { getCurrentAuthUserFromComponent } from "@/repositories/auth.repository";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAllProductViewsForAdminService,
  getProductViewsByProductIdService,
  getProductViewsStatsService,
  getProductViewsStatsByProductIdService,
  trackProductViewService,
} from "@/services/product_view.service";
import { getOrCreateGuestSessionId } from "@/lib/auth/guest-session";

/**
 * Track a product view (admin / legacy callers).
 * Storefront PDP must use POST /api/product-views instead — Server Actions
 * soft-refresh the current page and reset scroll position.
 */
export async function trackProductViewAction(
  productId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Read-only: must not refresh/write auth cookies during background tracking.
    const user = await getCurrentAuthUserFromComponent();

    let userId: string | null = null;
    let sessionId: string | null = null;

    if (user) {
      userId = user.id;
    } else {
      sessionId = await getOrCreateGuestSessionId();
    }

    const result = await trackProductViewService(productId, userId, sessionId);

    return result;
  } catch (error) {
    console.error("Error in trackProductViewAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to track product view",
    };
  }
}

/**
 * Get all product views for admin (with pagination)
 */
export async function getAllProductViewsAction(
  page: number = 1,
  pageSize: number = 50,
) {
  await requireAdmin();
  return getAllProductViewsForAdminService(page, pageSize);
}

/**
 * Get product views for a specific product (with pagination)
 */
export async function getProductViewsByProductIdAction(
  productId: string,
  page: number = 1,
  pageSize: number = 25,
) {
  await requireAdmin();
  return getProductViewsByProductIdService(productId, page, pageSize);
}

/**
 * Get product views statistics
 */
export async function getProductViewsStatsAction() {
  await requireAdmin();
  return getProductViewsStatsService();
}

/**
 * Get product views statistics for a single product
 */
export async function getProductViewsStatsByProductIdAction(productId: string) {
  await requireAdmin();
  return getProductViewsStatsByProductIdService(productId);
}
