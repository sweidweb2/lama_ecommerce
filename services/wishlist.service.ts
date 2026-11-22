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
import type { SessionContext } from "@/lib/auth/session-context";

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
 * Validate the session identity. Users additionally pass the admin-shopper gate.
 */
async function gateSession(
  session: SessionContext,
): Promise<ServiceOk | ServiceFail> {
  if (session.kind === "user") {
    const userGate = requireUuid(session.userId, "user id");
    if (!userGate.success) return userGate;
    return rejectAdminShopper(session.userId);
  }
  return requireUuid(session.sessionId, "session id");
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
 * Get wishlist items for the session (call from Server Components).
 */
export async function getWishlistItemsForSession(session: SessionContext) {
  return session.kind === "user"
    ? getWishlistItemsByUserId(session.userId)
    : getWishlistItemsBySessionId(session.sessionId);
}

/**
 * Count wishlist items for the session.
 */
export async function getWishlistCountForSession(
  session: SessionContext,
): Promise<number> {
  return session.kind === "user"
    ? countWishlistItemsByUserId(session.userId)
    : countWishlistItemsBySessionId(session.sessionId);
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
 * Add a product variant to the session's wishlist.
 */
export async function addToWishlistForSession(
  session: SessionContext,
  customisedProductId: string,
) {
  const sessionGate = await gateSession(session);
  if (!sessionGate.success) return sessionGate;
  const variantGate = requireUuid(customisedProductId, "product variant id");
  if (!variantGate.success) return variantGate;

  const gate = await assertWishlistVariantActive(customisedProductId);
  if (!gate.success) return gate;

  const variantId = customisedProductId.trim();
  return session.kind === "user"
    ? addWishlistItem(session.userId.trim(), variantId)
    : addWishlistItemForGuest(session.sessionId.trim(), variantId);
}

/**
 * Remove a wishlist entry by id for the session.
 */
export async function removeFromWishlistForSession(
  session: SessionContext,
  wishlistId: string,
) {
  const sessionGate = await gateSession(session);
  if (!sessionGate.success) return sessionGate;
  const idGate = requireUuid(wishlistId, "wishlist item");
  if (!idGate.success) return idGate;

  const id = wishlistId.trim();
  return session.kind === "user"
    ? removeWishlistItemById(session.userId.trim(), id)
    : removeWishlistItemByIdForGuest(session.sessionId.trim(), id);
}

/**
 * Remove a wishlist entry by product variant id for the session.
 */
export async function removeFromWishlistByVariantForSession(
  session: SessionContext,
  customisedProductId: string,
) {
  const sessionGate = await gateSession(session);
  if (!sessionGate.success) return sessionGate;
  const variantGate = requireUuid(customisedProductId, "product variant id");
  if (!variantGate.success) return variantGate;

  const variantId = customisedProductId.trim();
  return session.kind === "user"
    ? removeWishlistItemByVariant(session.userId.trim(), variantId)
    : removeWishlistItemByVariantForGuest(session.sessionId.trim(), variantId);
}

/**
 * Check if a product variant is in the session's wishlist.
 */
export async function checkIfInWishlistForSession(
  session: SessionContext,
  customisedProductId: string,
): Promise<boolean> {
  const identityGate =
    session.kind === "user"
      ? requireUuid(session.userId, "user id")
      : requireUuid(session.sessionId, "session id");
  if (
    !identityGate.success ||
    !requireUuid(customisedProductId, "product variant id").success
  ) {
    return false;
  }

  const variantId = customisedProductId.trim();
  return session.kind === "user"
    ? isInWishlist(session.userId.trim(), variantId)
    : isInWishlistForGuest(session.sessionId.trim(), variantId);
}

/**
 * Toggle a variant on the session's wishlist.
 */
export async function toggleWishlistForSession(
  session: SessionContext,
  customisedProductId: string,
) {
  const sessionGate = await gateSession(session);
  if (!sessionGate.success) return sessionGate;
  const variantGate = requireUuid(customisedProductId, "product variant id");
  if (!variantGate.success) return variantGate;

  const variantId = customisedProductId.trim();
  const inWishlist = await checkIfInWishlistForSession(session, variantId);
  if (inWishlist) {
    return removeFromWishlistByVariantForSession(session, variantId);
  }
  return addToWishlistForSession(session, variantId);
}

// ── Thin aliases (legacy names) ──────────────────────────────────────────────

/**
 * Get wishlist items for a user.
 */
export async function getWishlistItems(userId: string) {
  return getWishlistItemsForSession({ kind: "user", userId });
}

/**
 * Get wishlist items for a guest.
 */
export async function getWishlistItemsForGuest(sessionId: string) {
  return getWishlistItemsForSession({ kind: "guest", sessionId });
}

/**
 * Count wishlist items for a user.
 */
export async function getWishlistCount(userId: string): Promise<number> {
  return getWishlistCountForSession({ kind: "user", userId });
}

/**
 * Count wishlist items for a guest session.
 */
export async function getWishlistCountForGuest(
  sessionId: string,
): Promise<number> {
  return getWishlistCountForSession({ kind: "guest", sessionId });
}

/**
 * Add a product variant to the user's wishlist.
 */
export async function addToWishlist(
  userId: string,
  customisedProductId: string,
) {
  return addToWishlistForSession({ kind: "user", userId }, customisedProductId);
}

/**
 * Add a product variant to the guest's wishlist.
 */
export async function addToWishlistForGuest(
  sessionId: string,
  customisedProductId: string,
) {
  return addToWishlistForSession(
    { kind: "guest", sessionId },
    customisedProductId,
  );
}

/**
 * Remove a wishlist entry by id.
 */
export async function removeFromWishlist(userId: string, wishlistId: string) {
  return removeFromWishlistForSession({ kind: "user", userId }, wishlistId);
}

/**
 * Remove a wishlist entry by id for guest.
 */
export async function removeFromWishlistForGuest(
  sessionId: string,
  wishlistId: string,
) {
  return removeFromWishlistForSession({ kind: "guest", sessionId }, wishlistId);
}

/**
 * Remove a wishlist entry by product variant id.
 */
export async function removeFromWishlistByVariant(
  userId: string,
  customisedProductId: string,
) {
  return removeFromWishlistByVariantForSession(
    { kind: "user", userId },
    customisedProductId,
  );
}

/**
 * Remove a wishlist entry by product variant id for guest.
 */
export async function removeFromWishlistByVariantForGuest(
  sessionId: string,
  customisedProductId: string,
) {
  return removeFromWishlistByVariantForSession(
    { kind: "guest", sessionId },
    customisedProductId,
  );
}

/**
 * Toggle a variant on the authenticated user's wishlist.
 */
export async function toggleWishlistForUser(
  userId: string,
  customisedProductId: string,
) {
  return toggleWishlistForSession(
    { kind: "user", userId },
    customisedProductId,
  );
}

/**
 * Toggle a variant on the guest session wishlist.
 */
export async function toggleWishlistForGuest(
  sessionId: string,
  customisedProductId: string,
) {
  return toggleWishlistForSession(
    { kind: "guest", sessionId },
    customisedProductId,
  );
}

/**
 * Check if a product variant is in the user's wishlist.
 */
export async function checkIfInWishlist(
  userId: string,
  customisedProductId: string,
): Promise<boolean> {
  return checkIfInWishlistForSession(
    { kind: "user", userId },
    customisedProductId,
  );
}

/**
 * Check if a product variant is in the guest's wishlist.
 */
export async function checkIfInWishlistForGuest(
  sessionId: string,
  customisedProductId: string,
): Promise<boolean> {
  return checkIfInWishlistForSession(
    { kind: "guest", sessionId },
    customisedProductId,
  );
}
