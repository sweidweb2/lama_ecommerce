"use server";

import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import {
  addItemToCartService,
  addItemToGuestCartService,
  addItemToCartByIdService,
  getUserCartService,
  getUserCartWithItemsService,
  getGuestCartWithItemsService,
  mergeGuestCartToUserService,
  deleteCartItemService,
  deleteCartService,
  hardDeleteCartService,
  updateCartItemService,
  createCartForAdminService,
  getCartWithItemsForAdminService,
} from "@/services/cart.service";
import {
  clearGuestSessionCookie,
  getGuestSessionId,
  getOrCreateGuestSessionId,
} from "@/lib/auth/guest-session";
import { requireAdmin } from "@/lib/auth/require-admin";
import { revalidatePath } from "next/cache";

/**
 * Merge guest cart into the authenticated user's cart.
 * Called right after login so the user keeps the items they added as a guest.
 *
 * Flow:
 * 1. Verify the caller is authenticated.
 * 2. Read the guest_session_id cookie.
 * 3. If no session cookie → nothing to merge, return early.
 * 4. Delegate to mergeGuestCartToUserService which handles all four scenarios.
 * 5. Clean up the guest_session_id cookie.
 * 6. Revalidate /cart so the UI shows the merged cart.
 */
export async function mergeGuestCartOnLoginAction(): Promise<{
  success: boolean;
  error?: string;
  merged: boolean;
}> {
  const user = await getCurrentAuthUserFromAction();

  if (!user) {
    return { success: false, error: "Not authenticated", merged: false };
  }

  // Read the guest session cookie
  const sessionId = await getGuestSessionId();

  if (!sessionId) {
    // No guest session – nothing to merge
    return { success: true, merged: false };
  }

  // Merge the guest cart into the user's cart
  const result = await mergeGuestCartToUserService(user.id, sessionId);

  // Always clean up the guest cookie after login, regardless of merge outcome
  await clearGuestSessionCookie();

  if (result.success) {
    revalidatePath("/cart");
    revalidatePath("/checkout");
  }

  return result;
}

/**
 * Add item to cart action.
 * This is the server action called from client components.
 *
 * Flow:
 * 1. Check if user is authenticated
 * 2a. Authenticated → use existing addItemToCartService (user_id based)
 * 2b. Guest →
 *     - Read guest_session_id cookie
 *     - If missing → generate new session ID (crypto.randomUUID())
 *     - Set / refresh the cookie (14 days, HttpOnly, Secure, SameSite=Lax)
 *     - Check if an active cart exists for that session_id
 *     - If not → create a new guest cart (user_id=null, session_id)
 *     - Add cart item under that cart
 */
export async function addItemToCartAction(input: {
  customised_product_id: string;
  quantity: number;
}): Promise<{ success: boolean; error?: string; data?: any }> {
  // Check if user is authenticated
  const user = await getCurrentAuthUserFromAction();

  if (user) {
    // ── Authenticated user flow ──
    const result = await addItemToCartService(user.id, input);

    if (result.success) {
      revalidatePath("/cart");
      revalidatePath("/checkout");
    }

    return result;
  }

  // ── Guest user flow ──
  const sessionId = await getOrCreateGuestSessionId();

  // Delegate to guest cart service (creates cart if needed, adds item)
  const result = await addItemToGuestCartService(sessionId, input);

  if (result.success) {
    revalidatePath("/cart");
    revalidatePath("/checkout");
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
  data?: any;
}> {
  const user = await getCurrentAuthUserFromAction();

  if (user) {
    return await getUserCartService(user.id);
  }

  // Guest flow – use session cookie
  const sessionId = await getGuestSessionId();
  if (!sessionId) {
    return {
      success: false,
      error: "No active cart found",
    };
  }

  // Re-use getGuestCartWithItemsService to find the cart
  const result = await getGuestCartWithItemsService(sessionId);
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
export async function getUserCartWithItemsAction(): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  const user = await getCurrentAuthUserFromAction();

  if (user) {
    return await getUserCartWithItemsService(user.id);
  }

  // Guest flow – use session cookie
  const sessionId = await getGuestSessionId();
  if (!sessionId) {
    return {
      success: false,
      error: "No active cart found",
    };
  }

  return await getGuestCartWithItemsService(sessionId);
}

/**
 * Delete cart item action.
 * Authenticated users: RLS-scoped hard delete.
 * Guests: service-role delete scoped to guest_session_id cookie.
 */
export async function deleteCartItemAction(
  cartItemId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentAuthUserFromAction();

  let result: { success: boolean; error?: string };

  if (user) {
    result = await deleteCartItemService(cartItemId);
  } else {
    const sessionId = await getGuestSessionId();
    if (!sessionId) {
      return { success: false, error: "No active session found" };
    }
    const { hardDeleteCartItemForGuest } = await import(
      "@/repositories/cart_item.repository"
    );
    result = await hardDeleteCartItemForGuest(sessionId, cartItemId);
  }

  if (result.success) {
    revalidatePath("/cart");
    revalidatePath("/checkout");
  }

  return result;
}

/**
 * Delete cart action.
 * This is the server action called from client components (admin panel).
 * Soft-deletes a cart by setting deleted_at.
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
): Promise<{ success: boolean; error?: string; data?: any }> {
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
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    if (quantity < 1) {
      return {
        success: false,
        error: "Quantity must be at least 1",
      };
    }

    const user = await getCurrentAuthUserFromAction();
    let result: { success: boolean; error?: string; data?: any };

    if (user) {
      const { updateCartItem } = await import(
        "@/repositories/cart_item.repository"
      );
      result = await updateCartItem(cartItemId, { quantity });
    } else {
      const sessionId = await getGuestSessionId();
      if (!sessionId) {
        return { success: false, error: "No active session found" };
      }
      const { updateCartItemForGuest } = await import(
        "@/repositories/cart_item.repository"
      );
      result = await updateCartItemForGuest(sessionId, cartItemId, {
        quantity,
      });
    }

    if (result.success) {
      revalidatePath("/cart");
      revalidatePath("/checkout");
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
): Promise<{ success: boolean; error?: string; data?: any }> {
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
 * Create cart action (admin use).
 * This is the server action called from client components (admin panel).
 * Creates a cart for a specific user or with a session ID.
 */
export async function createCartAction(
  input: {
    user_id?: string | null;
    session_id?: string | null;
  },
): Promise<{ success: boolean; error?: string; data?: any }> {
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
  data?: { cart: any; items: any[]; subtotal: number };
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
