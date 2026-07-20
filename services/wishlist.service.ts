import {
  getWishlistItemsByUserId,
  getWishlistItemsBySessionId,
  countWishlistItemsByUserId,
  countWishlistItemsBySessionId,
  addWishlistItem,
  addWishlistItemForGuest,
  removeWishlistItemById,
  removeWishlistItemByIdForGuest,
  removeWishlistItemByVariant,
  removeWishlistItemByVariantForGuest,
  isInWishlist,
  isInWishlistForGuest,
  claimWishlistBySessionId,
} from "@/repositories/wishlist.repository";
import { getVariantWithParentActive } from "@/repositories/product_variant.repository";
import { getAdminShopBlockForUserId } from "@/services/profile.service";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ServiceFail = { success: false; error: string };
type ServiceOk = { success: true };

function requireUuid(
  value: string | null | undefined,
  label: string,
): ServiceOk | ServiceFail {
  if (typeof value !== "string" || !UUID_RE.test(value.trim())) {
    return { success: false, error: `Invalid ${label}` };
  }
  return { success: true };
}

async function rejectAdminShopper(
  userId: string,
): Promise<ServiceOk | ServiceFail> {
  const shopBlock = await getAdminShopBlockForUserId(userId);
  if (shopBlock) {
    return { success: false, error: shopBlock };
  }
  return { success: true };
}

/**
 * Ensure the variant exists and its parent product is active (stock not required).
 */
async function assertWishlistVariantActive(
  customisedProductId: string,
): Promise<ServiceOk | ServiceFail> {
  const variant = await getVariantWithParentActive(customisedProductId);
  if (!variant) {
    return { success: false, error: "Product variant not found" };
  }
  if (!variant.productIsActive) {
    return { success: false, error: "This product is no longer available" };
  }
  return { success: true };
}

/**
 * Get wishlist items for a user (call from Server Components with userId).
 */
export async function getWishlistItems(userId: string) {
  return getWishlistItemsByUserId(userId);
}

/**
 * Get wishlist items for a guest (call from Server Components with sessionId).
 */
export async function getWishlistItemsForGuest(sessionId: string) {
  return getWishlistItemsBySessionId(sessionId);
}

/**
 * Count wishlist items for a user.
 */
export async function getWishlistCount(userId: string): Promise<number> {
  return countWishlistItemsByUserId(userId);
}

/**
 * Count wishlist items for a guest session.
 */
export async function getWishlistCountForGuest(
  sessionId: string,
): Promise<number> {
  return countWishlistItemsBySessionId(sessionId);
}

/**
 * Attach guest wishlist rows for a session to a user account (login handoff).
 * Idempotent; uses service-role claim under the hood.
 */
export async function claimGuestWishlistService(
  userId: string,
  sessionId: string,
): Promise<{ success: boolean; error?: string; claimedCount: number }> {
  const userGate = requireUuid(userId, "user id");
  if (!userGate.success) {
    return { success: false, error: userGate.error, claimedCount: 0 };
  }
  const sessionGate = requireUuid(sessionId, "session id");
  if (!sessionGate.success) {
    return { success: false, error: sessionGate.error, claimedCount: 0 };
  }
  const adminGate = await rejectAdminShopper(userId);
  if (!adminGate.success) {
    return { success: false, error: adminGate.error, claimedCount: 0 };
  }
  return claimWishlistBySessionId(sessionId.trim(), userId.trim());
}

/**
 * Add a product variant to the user's wishlist.
 */
export async function addToWishlist(
  userId: string,
  customisedProductId: string,
) {
  const userGate = requireUuid(userId, "user id");
  if (!userGate.success) return userGate;
  const adminGate = await rejectAdminShopper(userId);
  if (!adminGate.success) return adminGate;
  const variantGate = requireUuid(customisedProductId, "product variant id");
  if (!variantGate.success) return variantGate;

  const gate = await assertWishlistVariantActive(customisedProductId);
  if (!gate.success) return gate;
  return addWishlistItem(userId.trim(), customisedProductId.trim());
}

/**
 * Add a product variant to the guest's wishlist.
 */
export async function addToWishlistForGuest(
  sessionId: string,
  customisedProductId: string,
) {
  const sessionGate = requireUuid(sessionId, "session id");
  if (!sessionGate.success) return sessionGate;
  const variantGate = requireUuid(customisedProductId, "product variant id");
  if (!variantGate.success) return variantGate;

  const gate = await assertWishlistVariantActive(customisedProductId);
  if (!gate.success) return gate;
  return addWishlistItemForGuest(sessionId.trim(), customisedProductId.trim());
}

/**
 * Remove a wishlist entry by id.
 */
export async function removeFromWishlist(
  userId: string,
  wishlistId: string,
) {
  const userGate = requireUuid(userId, "user id");
  if (!userGate.success) return userGate;
  const adminGate = await rejectAdminShopper(userId);
  if (!adminGate.success) return adminGate;
  const idGate = requireUuid(wishlistId, "wishlist item");
  if (!idGate.success) return idGate;
  return removeWishlistItemById(userId.trim(), wishlistId.trim());
}

/**
 * Remove a wishlist entry by id for guest.
 */
export async function removeFromWishlistForGuest(
  sessionId: string,
  wishlistId: string,
) {
  const sessionGate = requireUuid(sessionId, "session id");
  if (!sessionGate.success) return sessionGate;
  const idGate = requireUuid(wishlistId, "wishlist item");
  if (!idGate.success) return idGate;
  return removeWishlistItemByIdForGuest(sessionId.trim(), wishlistId.trim());
}

/**
 * Remove a wishlist entry by product variant id.
 */
export async function removeFromWishlistByVariant(
  userId: string,
  customisedProductId: string,
) {
  const userGate = requireUuid(userId, "user id");
  if (!userGate.success) return userGate;
  const adminGate = await rejectAdminShopper(userId);
  if (!adminGate.success) return adminGate;
  const variantGate = requireUuid(customisedProductId, "product variant id");
  if (!variantGate.success) return variantGate;
  return removeWishlistItemByVariant(
    userId.trim(),
    customisedProductId.trim(),
  );
}

/**
 * Remove a wishlist entry by product variant id for guest.
 */
export async function removeFromWishlistByVariantForGuest(
  sessionId: string,
  customisedProductId: string,
) {
  const sessionGate = requireUuid(sessionId, "session id");
  if (!sessionGate.success) return sessionGate;
  const variantGate = requireUuid(customisedProductId, "product variant id");
  if (!variantGate.success) return variantGate;
  return removeWishlistItemByVariantForGuest(
    sessionId.trim(),
    customisedProductId.trim(),
  );
}

/**
 * Toggle a variant on the authenticated user's wishlist.
 */
export async function toggleWishlistForUser(
  userId: string,
  customisedProductId: string,
) {
  const userGate = requireUuid(userId, "user id");
  if (!userGate.success) return userGate;
  const adminGate = await rejectAdminShopper(userId);
  if (!adminGate.success) return adminGate;
  const variantGate = requireUuid(customisedProductId, "product variant id");
  if (!variantGate.success) return variantGate;

  const inWishlist = await isInWishlist(
    userId.trim(),
    customisedProductId.trim(),
  );
  if (inWishlist) {
    return removeFromWishlistByVariant(
      userId.trim(),
      customisedProductId.trim(),
    );
  }
  return addToWishlist(userId.trim(), customisedProductId.trim());
}

/**
 * Toggle a variant on the guest session wishlist.
 */
export async function toggleWishlistForGuest(
  sessionId: string,
  customisedProductId: string,
) {
  const sessionGate = requireUuid(sessionId, "session id");
  if (!sessionGate.success) return sessionGate;
  const variantGate = requireUuid(customisedProductId, "product variant id");
  if (!variantGate.success) return variantGate;

  const inWishlist = await isInWishlistForGuest(
    sessionId.trim(),
    customisedProductId.trim(),
  );
  if (inWishlist) {
    return removeFromWishlistByVariantForGuest(
      sessionId.trim(),
      customisedProductId.trim(),
    );
  }
  return addToWishlistForGuest(sessionId.trim(), customisedProductId.trim());
}

/**
 * Check if a product variant is in the user's wishlist.
 */
export async function checkIfInWishlist(
  userId: string,
  customisedProductId: string,
): Promise<boolean> {
  if (
    !requireUuid(userId, "user id").success ||
    !requireUuid(customisedProductId, "product variant id").success
  ) {
    return false;
  }
  return isInWishlist(userId.trim(), customisedProductId.trim());
}

/**
 * Check if a product variant is in the guest's wishlist.
 */
export async function checkIfInWishlistForGuest(
  sessionId: string,
  customisedProductId: string,
): Promise<boolean> {
  if (
    !requireUuid(sessionId, "session id").success ||
    !requireUuid(customisedProductId, "product variant id").success
  ) {
    return false;
  }
  return isInWishlistForGuest(sessionId.trim(), customisedProductId.trim());
}

