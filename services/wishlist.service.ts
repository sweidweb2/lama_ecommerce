import {
  getWishlistItemsForSession as getWishlistItemsForSessionRepo,
  countWishlistItemsForSession,
  addWishlistItemForSession,
  insertWishlistItemForSession,
  removeWishlistItemByIdForSession,
  removeWishlistItemByVariantForSession,
  isInWishlistForSession,
  claimWishlistBySessionId,
} from "@/repositories/wishlist.repository";
import { getVariantWithParentActive } from "@/repositories/product_variant.repository";
import { getAdminShopBlockForUserId } from "@/services/profile.service";
import type { StorefrontOwner } from "@/types/storefront-owner";

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
 * Validate the session identity. The admin-shopper block is enforced in the
 * action layer (`getAdminShopBlockForCurrentUser`) for session-aware paths.
 */
function gateSession(session: StorefrontOwner): ServiceOk | ServiceFail {
  return session.kind === "user"
    ? requireUuid(session.userId, "user id")
    : requireUuid(session.sessionId, "session id");
}

/** Normalize identity whitespace before it reaches the repository. */
function trimSession(session: StorefrontOwner): StorefrontOwner {
  return session.kind === "user"
    ? { kind: "user", userId: session.userId.trim() }
    : { kind: "guest", sessionId: session.sessionId.trim() };
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
export async function getWishlistItemsForSession(session: StorefrontOwner) {
  return getWishlistItemsForSessionRepo(session);
}

/**
 * Count wishlist items for the session.
 */
export async function getWishlistCountForSession(
  session: StorefrontOwner,
): Promise<number> {
  return countWishlistItemsForSession(session);
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
  session: StorefrontOwner,
  customisedProductId: string,
) {
  const sessionGate = gateSession(session);
  if (!sessionGate.success) return sessionGate;
  const gate = await assertWishlistVariantActive(customisedProductId);
  if (!gate.success) return gate;

  return addWishlistItemForSession(
    trimSession(session),
    customisedProductId,
  );
}

/**
 * Remove a wishlist entry by id for the session.
 */
export async function removeFromWishlistForSession(
  session: StorefrontOwner,
  wishlistId: string,
) {
  const sessionGate = gateSession(session);
  if (!sessionGate.success) return sessionGate;
  return removeWishlistItemByIdForSession(
    trimSession(session),
    wishlistId,
  );
}

/**
 * Remove a wishlist entry by product variant id for the session.
 */
export async function removeFromWishlistByVariantForSession(
  session: StorefrontOwner,
  customisedProductId: string,
) {
  const sessionGate = gateSession(session);
  if (!sessionGate.success) return sessionGate;
  return removeWishlistItemByVariantForSession(
    trimSession(session),
    customisedProductId,
  );
}

/**
 * Check if a product variant is in the session's wishlist.
 */
export async function checkIfInWishlistForSession(
  session: StorefrontOwner,
  customisedProductId: string,
): Promise<boolean> {
  if (!gateSession(session).success) return false;

  return isInWishlistForSession(
    trimSession(session),
    customisedProductId,
  );
}

/**
 * Toggle a variant on the session's wishlist.
 * One existence check, then either delete or insert (no second select on add).
 */
export async function toggleWishlistForSession(
  session: StorefrontOwner,
  customisedProductId: string,
) {
  const sessionGate = gateSession(session);
  if (!sessionGate.success) return sessionGate;
  const owner = trimSession(session);
  const variantId = customisedProductId;

  const inWishlist = await isInWishlistForSession(owner, variantId);
  if (inWishlist) {
    return removeWishlistItemByVariantForSession(owner, variantId);
  }

  const gate = await assertWishlistVariantActive(variantId);
  if (!gate.success) return gate;

  return insertWishlistItemForSession(owner, variantId);
}
