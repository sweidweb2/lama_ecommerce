import {
  createCart,
  createCartForAdmin,
  hasActiveCartForSession,
  getCartForSession,
  getAllCartsForAdmin,
  getCartByIdForAdmin,
  deleteCart,
  hardDeleteCart,
  mergeGuestCartToUser,
  type AdminCartRow,
} from "@/repositories/cart.repository";
import {
  createCartItemAsAdmin,
  createCartItemForSession,
  getCartItemsWithProductsByCartId,
  getCartItemsWithProductsByCartIdForAdmin,
  hardDeleteCartItem,
  hardDeleteCartItemForSession,
  hardDeleteCartItemForAdmin,
  updateCartItem,
  updateCartItemForAdmin,
  updateCartItemForSession,
  type CartItemWithProduct,
} from "@/repositories/cart_item.repository";
import { incrementProductAddToCartService } from "@/services/product_view.service";
import type { Cart, CartItem } from "@/types/order";
import { createCartItemSchema } from "@/lib/validators/cart-item/create";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminShopBlockForUserId } from "@/services/profile.service";
import type { StorefrontOwner } from "@/types/storefront-owner";

type AddItemInput = {
  customised_product_id: string;
  quantity: number;
};

type AddItemResult = {
  success: boolean;
  error?: string;
  data?: { cart: Cart; cartItem: CartItem };
};

/**
 * Add item to the session's cart (user or guest).
 * Checks for an active cart, creates one if missing, then adds the item.
 * Guests are identified by session_id; concurrent first-ATC races (23505) reuse the winner's cart.
 */
export async function addItemForSession(
  session: StorefrontOwner,
  input: AddItemInput,
): Promise<AddItemResult> {
  const isUser = session.kind === "user";

  try {
    // Validate input using Zod schema
    const validated = createCartItemSchema.parse({
      customised_product_id: input.customised_product_id,
      quantity: input.quantity,
    });

    // Check if the session has an active cart
    const cartCheck = await hasActiveCartForSession(session);

    if (!cartCheck.success) {
      return {
        success: false,
        error:
          cartCheck.error ||
          (isUser
            ? "Failed to check for active cart"
            : "Failed to check for active guest cart"),
      };
    }

    let cart: Cart;

    if (cartCheck.hasActiveCart && cartCheck.data) {
      cart = cartCheck.data;
    } else {
      const cartResult =
        session.kind === "user"
          ? await createCart(session.userId, {})
          : await createCart(null, { session_id: session.sessionId });

      if (cartResult.success && cartResult.data) {
        cart = cartResult.data;
      } else if (cartResult.code === "23505") {
        // Concurrent ATC race: unique user/guest index — reuse the winner's cart
        const retry = await hasActiveCartForSession(session);
        if (!retry.success || !retry.hasActiveCart || !retry.data) {
          return {
            success: false,
            error:
              cartResult.error ||
              "Failed to create cart after concurrent conflict",
          };
        }
        cart = retry.data;
      } else {
        return {
          success: false,
          error: cartResult.error || "Failed to create cart",
        };
      }
    }

    // Add item to cart (UPSERT with stock validation handled atomically in database function).
    // The repo picks the session client for users and service-role for guests
    // (guest carts are not anon-accessible).
    const cartItemResult = await createCartItemForSession(session, {
      cart_id: cart.id,
      customised_product_id: validated.customised_product_id,
      quantity: validated.quantity,
    });

    if (!cartItemResult.success || !cartItemResult.data) {
      return {
        success: false,
        error: cartItemResult.error || "Failed to add item to cart",
      };
    }

    // Increment add_to_cart_count in product_stats (fire and forget)
    incrementProductAddToCartService(validated.customised_product_id).catch((error) => {
      console.error("Failed to increment add_to_cart_count:", error);
    });

    return {
      success: true,
      data: {
        cart,
        cartItem: cartItemResult.data,
      },
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      const firstError = zodError.errors?.[0];
      return {
        success: false,
        error: firstError?.message || "Invalid cart item data",
      };
    }

    console.error("Error in addItemForSession:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : isUser
            ? "Failed to add item to cart"
            : "Failed to add item to guest cart",
    };
  }
}

/**
 * Get user's active cart.
 */
export async function getUserCartService(
  userId: string,
): Promise<{ success: boolean; error?: string; data?: Cart }> {
  return await getCartForSession({ kind: "user", userId });
}

type CartWithItemsServiceResult = {
  success: boolean;
  error?: string;
  data?: { cart: Cart; items: CartItemWithProduct[] };
};

/**
 * Get the session's active cart with items and product details.
 * Users read via RLS-scoped client; guests via session_id + service-role item read.
 */
export async function getCartWithItemsForSession(
  session: StorefrontOwner,
): Promise<CartWithItemsServiceResult> {
  try {
    const cartResult = await getCartForSession(session);

    if (!cartResult.success || !cartResult.data) {
      return {
        success: false,
        error: cartResult.error || "No active cart found",
      };
    }

    const cart = cartResult.data;

    // Guest cart items require service-role read (RLS denies anon guest rows)
    const items =
      session.kind === "user"
        ? await getCartItemsWithProductsByCartId(cart.id)
        : await getCartItemsWithProductsByCartIdForAdmin(cart.id);

    return {
      success: true,
      data: {
        cart,
        items,
      },
    };
  } catch (error) {
    console.error("Error in getCartWithItemsForSession:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : session.kind === "user"
            ? "Failed to fetch cart with items"
            : "Failed to fetch guest cart with items",
    };
  }
}

/**
 * Hard delete a cart item for the session.
 * Users: RLS-scoped delete. Guests: service-role delete scoped by session id.
 */
export async function deleteCartItemForSession(
  session: StorefrontOwner,
  cartItemId: string,
): Promise<{ success: boolean; error?: string }> {
  return await hardDeleteCartItemForSession(session, cartItemId);
}

/**
 * Update quantity for a session's cart item.
 * Users: RLS-scoped update. Guests: service-role update scoped by session id.
 */
export async function updateCartItemQuantityForSession(
  session: StorefrontOwner,
  cartItemId: string,
  quantity: number,
): Promise<{ success: boolean; error?: string; data?: CartItem }> {
  return await updateCartItemForSession(session, cartItemId, { quantity });
}

/**
 * Hard delete a cart item (authenticated user, RLS-scoped).
 * Permanently removes the item from the cart.
 */
export async function deleteCartItemService(
  cartItemId: string,
): Promise<{ success: boolean; error?: string }> {
  return await hardDeleteCartItem(cartItemId);
}

/**
 * Get all carts for admin panel.
 * Returns carts with user information, item counts, and totals.
 */
export async function getAllCartsForAdminService(): Promise<AdminCartRow[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return await getAllCartsForAdmin();
}

/**
 * Get cart with items for admin panel.
 * Returns cart with all its items and product details.
 */
export async function getCartWithItemsForAdminService(
  cartId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { cart: Cart; items: CartItemWithProduct[] };
}> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get cart by ID (admin access)
    const cartResult = await getCartByIdForAdmin(cartId);

    if (!cartResult.success || !cartResult.data) {
      return {
        success: false,
        error: cartResult.error || "Cart not found",
      };
    }

    const cart = cartResult.data;

    // Get cart items with product details (admin version)
    const items = await getCartItemsWithProductsByCartIdForAdmin(cart.id);

    return {
      success: true,
      data: {
        cart,
        items,
      },
    };
  } catch (error) {
    console.error("Error in getCartWithItemsForAdminService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch cart with items",
    };
  }
}

/**
 * Update cart item service (admin use).
 * Updates a cart item, typically the quantity.
 */
export async function updateCartItemService(
  cartItemId: string,
  input: { quantity: number },
): Promise<{ success: boolean; error?: string; data?: CartItem }> {
  return await updateCartItemForAdmin(cartItemId, { quantity: input.quantity });
}

/**
 * Delete cart item service (admin use).
 * Hard-deletes a single cart line item.
 */
export async function deleteCartItemForAdminService(
  cartItemId: string,
): Promise<{ success: boolean; error?: string }> {
  return await hardDeleteCartItemForAdmin(cartItemId);
}

/**
 * Delete cart service.
 * Hard-deletes a cart (items cascade).
 */
export async function deleteCartService(
  cartId: string,
): Promise<{ success: boolean; error?: string }> {
  return await deleteCart(cartId);
}

/**
 * Hard delete cart service.
 * Cart items are removed via ON DELETE CASCADE in a single delete.
 */
export async function hardDeleteCartService(
  cartId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    return await hardDeleteCart(cartId);
  } catch (error) {
    console.error("Error in hardDeleteCartService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete cart",
    };
  }
}

/**
 * Create a cart for admin use.
 * Creates a cart for a specific user or with a session ID.
 */
export async function createCartForAdminService(
  input: { user_id?: string | null; session_id?: string | null },
): Promise<{ success: boolean; error?: string; data?: Cart }> {
  return await createCartForAdmin(input);
}

export type MergeGuestCartResult = {
  success: boolean;
  error?: string;
  merged: boolean;
  /** Per-line skip/clamp messages when the merge only partially succeeded. */
  errors?: string[];
};

/**
 * Merge a guest cart into the authenticated user's cart on login.
 * Uses merge_guest_cart_to_user RPC (single DB transaction).
 * Per-line stock skips/clamps are returned in `errors` without failing the merge.
 */
export async function mergeGuestCartToUserService(
  userId: string,
  sessionId: string,
): Promise<MergeGuestCartResult> {
  try {
    const shopBlock = await getAdminShopBlockForUserId(userId);
    if (shopBlock) {
      return { success: false, error: shopBlock, merged: false };
    }

    const result = await mergeGuestCartToUser(userId, sessionId);
    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to merge guest cart",
        merged: false,
      };
    }

    const merged = result.merged ?? result.movedCount > 0;
    return result.errors && result.errors.length > 0
      ? { success: true, merged, errors: result.errors }
      : { success: true, merged };
  } catch (error) {
    console.error("Error in mergeGuestCartToUserService:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to merge guest cart",
      merged: false,
    };
  }
}

/**
 * Add item to a specific cart by cart ID (admin use).
 * Directly adds the item to the specified cart without checking for user's active cart.
 */
export async function addItemToCartByIdService(
  cartId: string,
  input: {
    customised_product_id: string;
    quantity: number;
  },
): Promise<{ success: boolean; error?: string; data?: CartItem }> {
  try {
    // Validate input using Zod schema
    const validated = createCartItemSchema.parse({
      customised_product_id: input.customised_product_id,
      quantity: input.quantity,
    });

    // Add item directly to the specified cart (admin may target guest carts)
    const cartItemResult = await createCartItemAsAdmin({
      cart_id: cartId,
      customised_product_id: validated.customised_product_id,
      quantity: validated.quantity,
    });

    if (!cartItemResult.success || !cartItemResult.data) {
      return {
        success: false,
        error: cartItemResult.error || "Failed to add item to cart",
      };
    }

    // Increment add_to_cart_count in product_stats (fire and forget)
    incrementProductAddToCartService(validated.customised_product_id).catch((error) => {
      console.error("Failed to increment add_to_cart_count:", error);
    });

    return {
      success: true,
      data: cartItemResult.data,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      const firstError = zodError.errors?.[0];
      return {
        success: false,
        error: firstError?.message || "Invalid cart item data",
      };
    }

    console.error("Error in addItemToCartByIdService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add item to cart",
    };
  }
}
