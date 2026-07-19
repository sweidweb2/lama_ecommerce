import {
  getWishlistItemsByUserId,
  getWishlistItemsBySessionId,
  addWishlistItem,
  addWishlistItemForGuest,
  removeWishlistItemById,
  removeWishlistItemByVariant,
  removeWishlistItemByVariantForGuest,
  isInWishlist,
  isInWishlistForGuest,
  claimWishlistBySessionId,
} from "@/repositories/wishlist.repository";

/**
 * Get wishlist items for a user (call from Server Components with userId).
 */
export async function getWishlistItems(userId: string): Promise<any[]> {
  return getWishlistItemsByUserId(userId);
}

/**
 * Get wishlist items for a guest (call from Server Components with sessionId).
 */
export async function getWishlistItemsForGuest(sessionId: string): Promise<any[]> {
  return getWishlistItemsBySessionId(sessionId);
}

/**
 * Attach guest wishlist rows for a session to a user account (login handoff).
 * Idempotent; uses service-role claim under the hood.
 */
export async function claimGuestWishlistService(
  userId: string,
  sessionId: string,
): Promise<{ success: boolean; error?: string; claimedCount: number }> {
  return claimWishlistBySessionId(sessionId, userId);
}

/**
 * Add a product variant to the user's wishlist.
 */
export async function addToWishlist(
  userId: string,
  customisedProductId: string,
) {
  return addWishlistItem(userId, customisedProductId);
}

/**
 * Add a product variant to the guest's wishlist.
 */
export async function addToWishlistForGuest(
  sessionId: string,
  customisedProductId: string,
) {
  return addWishlistItemForGuest(sessionId, customisedProductId);
}

/**
 * Remove a wishlist entry by id.
 */
export async function removeFromWishlist(
  userId: string,
  wishlistId: string,
) {
  return removeWishlistItemById(userId, wishlistId);
}

/**
 * Remove a wishlist entry by product variant id.
 */
export async function removeFromWishlistByVariant(
  userId: string,
  customisedProductId: string,
) {
  return removeWishlistItemByVariant(userId, customisedProductId);
}

/**
 * Remove a wishlist entry by product variant id for guest.
 */
export async function removeFromWishlistByVariantForGuest(
  sessionId: string,
  customisedProductId: string,
) {
  return removeWishlistItemByVariantForGuest(sessionId, customisedProductId);
}

/**
 * Check if a product variant is in the user's wishlist.
 */
export async function checkIfInWishlist(
  userId: string,
  customisedProductId: string,
): Promise<boolean> {
  return isInWishlist(userId, customisedProductId);
}

/**
 * Check if a product variant is in the guest's wishlist.
 */
export async function checkIfInWishlistForGuest(
  sessionId: string,
  customisedProductId: string,
): Promise<boolean> {
  return isInWishlistForGuest(sessionId, customisedProductId);
}
