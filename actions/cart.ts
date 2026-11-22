"use server";

import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import {
  addItemForSession,
  addItemToCartByIdService,
  getUserCartService,
  getCartWithItemsForSession,
  mergeGuestCartToUserService,
  deleteCartItemForSession,
  deleteCartService,
  hardDeleteCartService,
  updateCartItemService,
  deleteCartItemForAdminService,
  updateCartItemQuantityForSession,
  createCartForAdminService,
  getCartWithItemsForAdminService,
} from "@/services/cart.service";
import { claimGuestOrdersService } from "@/services/order.service";
import { claimGuestWishlistService } from "@/services/wishlist.service";
import { getAdminShopBlockForUserId } from "@/services/profile.service";
import {
  clearGuestSessionCookie,
  getGuestSessionId,
} from "@/lib/auth/guest-session";
import { resolveStorefrontSession } from "@/lib/auth/session-context";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminShopBlockForCurrentUser } from "@/lib/auth/require-customer-shop";
import { revalidatePath } from "next/cache";
import type { Cart, CartItem } from "@/types/order";
import type { CartItemWithProduct } from "@/repositories/cart_item.repository";

type GuestHandoffFailedStep = "orders" | "cart" | "wishlist" | "auth";

export type GuestHandoffResult = {
  success: boolean;
  error?: string;
  merged: boolean;
  /** True when guest_session_id was cleared after a full successful handoff. */
  clearedGuestCookie?: boolean;
  /** True when handoff skipped claim/merge because the user is an admin. */
  skippedAsAdmin?: boolean;
  /** What completed before failure (or all true on full success). */
  ordersClaimed?: boolean;
  cartMerged?: boolean;
  wishlistClaimed?: boolean;
  failedStep?: GuestHandoffFailedStep;
};

type CartMutationResult = {
  success: boolean;
  error?: string;
  data?:
    | CartItem
    | Cart
    | { cart: Cart; cartItem: CartItem }
    | { cart: Cart; items: CartItemWithProduct[] };
};

type CartWithItemsResult = {
  success: boolean;
  error?: string;
  data?: { cart: Cart; items: CartItemWithProduct[] };
};

/**
 * Claim guest orders, merge guest cart, and claim guest wishlist for a known user.
 * Used by the login action and the auth email-confirm callback (where auth cookies
 * are on the redirect response, so the action's getUser would miss the new session).
 *
 * Admins never claim/merge — guest cookie is cleared and guest rows stay unclaimed.
 * For customers, clears guest_session_id only after all three succeed.
 */
export async function performGuestSessionHandoff(
  userId: string,
  userEmail?: string | null,
): Promise<GuestHandoffResult> {
  const sessionId = await getGuestSessionId();

  if (!sessionId) {
    return { success: true, merged: false, clearedGuestCookie: false };
  }

  const adminBlock = await getAdminShopBlockForUserId(userId);
  if (adminBlock) {
    await clearGuestSessionCookie();
    return {
      success: true,
      merged: false,
      clearedGuestCookie: true,
      skippedAsAdmin: true,
    };
  }

  const claimResult = await claimGuestOrdersService(
    userId,
    sessionId,
    userEmail,
  );
  if (!claimResult.success) {
    return {
      success: false,
      error: claimResult.error || "Failed to claim guest orders",
      merged: false,
      clearedGuestCookie: false,
      ordersClaimed: false,
      failedStep: "orders",
    };
  }

  const mergeResult = await mergeGuestCartToUserService(userId, sessionId);
  if (!mergeResult.success) {
    return {
      success: false,
      error: mergeResult.error || "Failed to merge guest cart",
      merged: false,
      clearedGuestCookie: false,
      ordersClaimed: true,
      cartMerged: false,
      failedStep: "cart",
    };
  }

  const wishlistResult = await claimGuestWishlistService(userId, sessionId);
  if (!wishlistResult.success) {
    return {
      success: false,
      error: wishlistResult.error || "Failed to claim guest wishlist",
      merged: false,
      clearedGuestCookie: false,
      ordersClaimed: true,
      cartMerged: true,
      wishlistClaimed: false,
      failedStep: "wishlist",
    };
  }

  await clearGuestSessionCookie();
  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/order_details");
  revalidatePath("/wishlist");

  return {
    ...mergeResult,
    clearedGuestCookie: true,
    ordersClaimed: true,
    cartMerged: true,
    wishlistClaimed: true,
  };
}

/**
 * Claim guest orders, merge guest cart, and claim guest wishlist onto the
 * authenticated user. Called after login / email confirm so guest data is kept.
 *
 * Flow:
 * 1. Verify the caller is authenticated.
 * 2. Read the guest_session_id cookie.
 * 3. If no session cookie → nothing to do, return early.
 * 4. Claim guest orders (session_id → user_id, email must match) via service role.
 * 5. Merge guest cart into the user's cart.
 * 6. Claim guest wishlist onto the user (delete dupes).
 * 7. Clear guest_session_id only after all three succeed.
 * 8. Revalidate cart, orders, and wishlist paths.
 */
export async function mergeGuestCartOnLoginAction(): Promise<GuestHandoffResult> {
  const user = await getCurrentAuthUserFromAction();

  if (!user) {
    return {
      success: false,
      error: "Not authenticated",
      merged: false,
      failedStep: "auth",
    };
  }

  return performGuestSessionHandoff(user.id, user.email);
}

/**
 * Add item to cart action.
 * This is the server action called from client components.
 *
 * Flow:
 * 1. Resolve the storefront session (auth user, else guest_session_id cookie;
 *    a new guest cookie is minted when missing).
 * 2. Delegate to addItemForSession (finds/creates the active cart, adds the item).
 */
export async function addItemToCartAction(input: {
  customised_product_id: string;
  quantity: number;
}): Promise<CartMutationResult> {
  const shopBlock = await getAdminShopBlockForCurrentUser();
  if (shopBlock) {
    return { success: false, error: shopBlock };
  }

  const session = await resolveStorefrontSession({ createGuestIfMissing: true });
  if (!session) {
    return { success: false, error: "No active session found" };
  }

  const result = await addItemForSession(session, input);

  if (result.success) {
    revalidatePath("/cart");
  }

  return result;
}

/**
 * Get user's (or guest's) cart action.
 * This is the server action called from client components.
 */
export async function getUserCartAction(): Promise<{
  success: boolean;
  error?: string;
  data?: Cart;
}> {
  const session = await resolveStorefrontSession();
  if (!session) {
    return {
      success: false,
      error: "No active cart found",
    };
  }

  if (session.kind === "user") {
    return await getUserCartService(session.userId);
  }

  // Guest flow – re-use the unified cart lookup to find the cart
  const result = await getCartWithItemsForSession(session);
  if (result.success && result.data) {
    return { success: true, data: result.data.cart };
  }
  return { success: false, error: result.error || "No active cart found" };
}

/**
 * Get user's (or guest's) cart with items action.
 * This is the server action called from client and server components.
 *
 * Flow:
 * - Authenticated → fetch cart by user_id
 * - Guest → read guest_session_id cookie → fetch cart by session_id
 * - No session / no cart → returns { success: false }
 */
export async function getUserCartWithItemsAction(): Promise<CartWithItemsResult> {
  const session = await resolveStorefrontSession();
  if (!session) {
    return {
      success: false,
      error: "No active cart found",
    };
  }

  return await getCartWithItemsForSession(session);
}

/**
 * Delete cart item action.
 * Authenticated users: RLS-scoped hard delete.
 * Guests: service-role delete scoped to guest_session_id cookie.
 */
export async function deleteCartItemAction(
  cartItemId: string,
): Promise<{ success: boolean; error?: string }> {
  const shopBlock = await getAdminShopBlockForCurrentUser();
  if (shopBlock) {
    return { success: false, error: shopBlock };
  }

  const session = await resolveStorefrontSession();
  if (!session) {
    return { success: false, error: "No active session found" };
  }

  const result = await deleteCartItemForSession(session, cartItemId);

  if (result.success) {
    revalidatePath("/cart");
  }

  return result;
}

/**
 * Delete cart action.
 * This is the server action called from client components (admin panel).
 * Hard-deletes a cart (items cascade via FK).
 */
export async function deleteCartAction(
  cartId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  // Call service to delete cart
  const result = await deleteCartService(cartId);

  // Revalidate admin carts page if successful
  if (result.success) {
    revalidatePath("/admin/carts");
  }

  return result;
}

/**
 * Hard delete cart action.
 * This is the server action called from client components (admin panel).
 * Hard deletes all cart items first, then hard deletes the cart itself.
 */
export async function hardDeleteCartAction(
  cartId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  // Call service to hard delete cart (deletes items first, then cart)
  const result = await hardDeleteCartService(cartId);

  // Revalidate admin carts pages if successful
  if (result.success) {
    revalidatePath("/admin/carts");
    revalidatePath(`/admin/carts/${cartId}`);
  }

  return result;
}

/**
 * Add item to a specific cart by cart ID (admin use).
 * This is the server action called from client components (admin panel).
 */
export async function addItemToCartByIdAction(
  cartId: string,
  input: {
    customised_product_id: string;
    quantity: number;
  },
): Promise<CartMutationResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  // Call service to add item to the specified cart
  const result = await addItemToCartByIdService(cartId, input);

  // Revalidate admin cart details page if successful
  if (result.success) {
    revalidatePath(`/admin/carts/${cartId}`);
    revalidatePath("/admin/carts");
  }

  return result;
}

/**
 * Update cart item quantity action (public use).
 * Authenticated users: RLS-scoped update.
 * Guests: service-role update scoped to guest_session_id cookie.
 */
export async function updateCartItemQuantityAction(
  cartItemId: string,
  quantity: number,
): Promise<CartMutationResult> {
  try {
    const shopBlock = await getAdminShopBlockForCurrentUser();
    if (shopBlock) {
      return { success: false, error: shopBlock };
    }

    if (quantity < 1) {
      return {
        success: false,
        error: "Quantity must be at least 1",
      };
    }

    const session = await resolveStorefrontSession();
    if (!session) {
      return { success: false, error: "No active session found" };
    }

    const result: CartMutationResult = await updateCartItemQuantityForSession(
      session,
      cartItemId,
      quantity,
    );

    if (result.success) {
      revalidatePath("/cart");
    }

    return result;
  } catch (error) {
    console.error("Error in updateCartItemQuantityAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update cart item",
    };
  }
}

/**
 * Update cart item action (admin use).
 * This is the server action called from client components (admin panel).
 * Updates the quantity of a cart item.
 */
export async function updateCartItemAction(
  cartItemId: string,
  quantity: number,
  cartId: string,
): Promise<CartMutationResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  // Call service to update cart item
  const result = await updateCartItemService(cartItemId, { quantity });

  // Revalidate admin cart details page if successful
  if (result.success) {
    revalidatePath(`/admin/carts/${cartId}`);
    revalidatePath("/admin/carts");
  }

  return result;
}

/**
 * Delete cart item action (admin use).
 * Hard-deletes a single line item from an admin cart view.
 */
export async function deleteCartItemForAdminAction(
  cartItemId: string,
  cartId: string,
): Promise<CartMutationResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const result = await deleteCartItemForAdminService(cartItemId);

  if (result.success) {
    revalidatePath(`/admin/carts/${cartId}`);
    revalidatePath("/admin/carts");
  }

  return result;
}

/**
 * Create cart action (admin use).
 * This is the server action called from client components (admin panel).
 * Creates a cart for a specific user or with a session ID.
 */
export async function createCartAction(
  input: {
    user_id?: string | null;
    session_id?: string | null;
  },
): Promise<CartMutationResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  // Call service to create cart
  const result = await createCartForAdminService(input);

  // Revalidate admin carts pages if successful
  if (result.success) {
    revalidatePath("/admin/carts");
  }

  return result;
}

/**
 * Get cart with items for admin (server action).
 * Used by admin checkout dialog to fetch cart data.
 */
export async function getCartWithItemsForAdminAction(
  cartId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { cart: Cart; items: CartItemWithProduct[]; subtotal: number };
}> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const result = await getCartWithItemsForAdminService(cartId);

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || "Cart not found",
    };
  }

  // Calculate subtotal
  const subtotal = result.data.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  return {
    success: true,
    data: {
      cart: result.data.cart,
      items: result.data.items,
      subtotal,
    },
  };
}
