"use server";

import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAllProductViewsForAdminService,
  getProductViewsByProductIdService,
  getProductViewsStatsService,
  trackProductViewService,
} from "@/services/product_view.service";
import { getOrCreateGuestSessionId } from "@/lib/auth/guest-session";

/**
 * Track a product view.
 * For authenticated users: uses user_id
 * For guests: uses session_id (from cookie or generates new one)
 */
export async function trackProductViewAction(
  productId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user
    const user = await getCurrentAuthUserFromAction();

    let userId: string | null = null;
    let sessionId: string | null = null;

    if (user) {
      userId = user.id;
    } else {
      sessionId = await getOrCreateGuestSessionId();
    }

    // Track the view
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
  pageSize: number = 20,
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
