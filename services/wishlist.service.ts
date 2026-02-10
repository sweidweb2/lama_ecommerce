import {
  getWishlistItemsByUserId,
  addWishlistItem,
  removeWishlistItemById,
  removeWishlistItemByVariant,
  isInWishlist,
} from "@/repositories/wishlist.repository";

/**
 * Get wishlist items for a user (call from Server Components with userId).
 */
export async function getWishlistItems(userId: string): Promise<any[]> {
  return getWishlistItemsByUserId(userId);
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
 * Check if a product variant is in the user's wishlist.
 */
export async function checkIfInWishlist(
  userId: string,
  customisedProductId: string,
): Promise<boolean> {
  return isInWishlist(userId, customisedProductId);
}
