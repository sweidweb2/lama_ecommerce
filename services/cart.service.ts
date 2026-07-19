import {
  createCart,
  createCartForAdmin,
  hasActiveCart,
  hasActiveCartBySessionId,
  getCartByUserId,
  getCartBySessionId,
  getAllCartsForAdmin,
  getCartByIdForAdmin,
  deleteCart,
  hardDeleteCart,
  updateCartUserId,
  deleteCartAdmin,
  type AdminCartRow,
} from "@/repositories/cart.repository";
import {
  createCartItem,
  createCartItemAsAdmin,
  getCartItemsWithProductsByCartId,
  getCartItemsWithProductsByCartIdForAdmin,
  hardDeleteCartItem,
  hardDeleteCartItemForGuest,
  hardDeleteCartItemsByCartId,
  updateCartItem,
  updateCartItemForAdmin,
  updateCartItemForGuest,
  moveCartItemsToCart,
  type CartItemWithProduct,
} from "@/repositories/cart_item.repository";
import { incrementProductAddToCartService } from "@/services/product_view.service";
import type { Cart, CartItem } from "@/types/order";
import { createCartItemSchema } from "@/lib/validators/cart-item/create";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * Add item to cart service.
 * Checks if user has an active cart, creates one if not, then adds the item.
 */
export async function addItemToCartService(
  userId: string,
  input: {
    customised_product_id: string;
    quantity: number;
  },
): Promise<{ success: boolean; error?: string; data?: { cart: Cart; cartItem: CartItem } }> {
  try {
    // Validate input using Zod schema
    const validated = createCartItemSchema.parse({
      customised_product_id: input.customised_product_id,
      quantity: input.quantity,
    });

    // Check if user has an active cart
    const cartCheck = await hasActiveCart(userId);
    
    if (!cartCheck.success) {
      return {
        success: false,
        error: cartCheck.error || "Failed to check for active cart",
      };
    }

    let cart: Cart;

    // If user has an active cart, use it
    if (cartCheck.hasActiveCart && cartCheck.data) {
      cart = cartCheck.data;
    } else {
      // Create a new cart for the user
      const cartResult = await createCart(userId, {});

      if (!cartResult.success || !cartResult.data) {
        return {
          success: false,
          error: cartResult.error || "Failed to create cart",
        };
      }

      cart = cartResult.data;
    }

    // Add item to cart (UPSERT with stock validation handled atomically in database function)
    const cartItemResult = await createCartItem({
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

    console.error("Error in addItemToCartService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add item to cart",
    };
  }
}

/**
 * Add item to guest cart service.
 * Checks if session has an active cart, creates one if not, then adds the item.
 * Used for unauthenticated (guest) users identified by session_id.
 */
export async function addItemToGuestCartService(
  sessionId: string,
  input: {
    customised_product_id: string;
    quantity: number;
  },
): Promise<{ success: boolean; error?: string; data?: { cart: Cart; cartItem: CartItem } }> {
  try {
    // Validate input using Zod schema
    const validated = createCartItemSchema.parse({
      customised_product_id: input.customised_product_id,
      quantity: input.quantity,
    });

    // Check if guest session has an active cart
    const cartCheck = await hasActiveCartBySessionId(sessionId);

    if (!cartCheck.success) {
      return {
        success: false,
        error: cartCheck.error || "Failed to check for active guest cart",
      };
    }

    let cart: Cart;

    // If session has an active cart, use it
    if (cartCheck.hasActiveCart && cartCheck.data) {
      cart = cartCheck.data;
    } else {
      // Create a new cart for the guest session
      const cartResult = await createCart(null, { session_id: sessionId });

      if (cartResult.success && cartResult.data) {
        cart = cartResult.data;
      } else if (cartResult.code === "23505") {
        // Concurrent ATC race: another request won the unique index — reuse it
        const retry = await hasActiveCartBySessionId(sessionId);
        if (!retry.success || !retry.hasActiveCart || !retry.data) {
          return {
            success: false,
            error:
              cartResult.error ||
              "Failed to create guest cart after concurrent conflict",
          };
        }
        cart = retry.data;
      } else {
        return {
          success: false,
          error: cartResult.error || "Failed to create guest cart",
        };
      }
    }

    // Add item to cart (UPSERT via service role — guest carts are not anon-accessible)
    const cartItemResult = await createCartItemAsAdmin({
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

    console.error("Error in addItemToGuestCartService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add item to guest cart",
    };
  }
}

/**
 * Get user's active cart.
 */
export async function getUserCartService(
  userId: string,
): Promise<{ success: boolean; error?: string; data?: Cart }> {
  return await getCartByUserId(userId);
}

/**
 * Get user's active cart with items and product details.
 */
export async function getUserCartWithItemsService(
  userId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { cart: Cart; items: CartItemWithProduct[] };
}> {
  try {
    // Get user's active cart
    const cartResult = await getCartByUserId(userId);

    if (!cartResult.success || !cartResult.data) {
      return {
        success: false,
        error: cartResult.error || "No active cart found",
      };
    }

    const cart = cartResult.data;

    // Get cart items with product details
    const items = await getCartItemsWithProductsByCartId(cart.id);

    return {
      success: true,
      data: {
        cart,
        items,
      },
    };
  } catch (error) {
    console.error("Error in getUserCartWithItemsService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch cart with items",
    };
  }
}

/**
 * Get guest's active cart with items and product details.
 * Uses session_id to identify the guest's cart.
 */
export async function getGuestCartWithItemsService(
  sessionId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { cart: Cart; items: CartItemWithProduct[] };
}> {
  try {
    // Get guest's active cart by session_id
    const cartResult = await getCartBySessionId(sessionId);

    if (!cartResult.success || !cartResult.data) {
      return {
        success: false,
        error: cartResult.error || "No active cart found",
      };
    }

    const cart = cartResult.data;

    // Guest cart items require service-role read (RLS denies anon guest rows)
    const items = await getCartItemsWithProductsByCartIdForAdmin(cart.id);

    return {
      success: true,
      data: {
        cart,
        items,
      },
    };
  } catch (error) {
    console.error("Error in getGuestCartWithItemsService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch guest cart with items",
    };
  }
}

/**
 * Hard delete a cart item.
 * Permanently removes the item from the cart.
 */
export async function deleteCartItemService(
  cartItemId: string,
): Promise<{ success: boolean; error?: string }> {
  return await hardDeleteCartItem(cartItemId);
}

/**
 * Hard delete a guest cart item, scoped by guest session id.
 */
export async function deleteCartItemForGuestService(
  sessionId: string,
  cartItemId: string,
): Promise<{ success: boolean; error?: string }> {
  return await hardDeleteCartItemForGuest(sessionId, cartItemId);
}

/**
 * Update quantity for an authenticated user's cart item (RLS-scoped).
 */
export async function updateUserCartItemQuantityService(
  cartItemId: string,
  quantity: number,
): Promise<{ success: boolean; error?: string; data?: CartItem }> {
  return await updateCartItem(cartItemId, { quantity });
}

/**
 * Update quantity for a guest cart item, scoped by guest session id.
 */
export async function updateCartItemQuantityForGuestService(
  sessionId: string,
  cartItemId: string,
  quantity: number,
): Promise<{ success: boolean; error?: string; data?: CartItem }> {
  return await updateCartItemForGuest(sessionId, cartItemId, { quantity });
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
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }
  return await updateCartItemForAdmin(cartItemId, { quantity: input.quantity });
}

/**
 * Delete cart service.
 * Hard-deletes a cart (items cascade).
 */
export async function deleteCartService(
  cartId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }
  return await deleteCart(cartId);
}

/**
 * Hard delete cart service.
 * First hard deletes all cart items, then hard deletes the cart itself.
 * Used for admin operations.
 */
export async function hardDeleteCartService(
  cartId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // First, hard delete all cart items
    const deleteItemsResult = await hardDeleteCartItemsByCartId(cartId);
    
    if (!deleteItemsResult.success) {
      return {
        success: false,
        error: deleteItemsResult.error || "Failed to delete cart items",
      };
    }

    // Then, hard delete the cart
    const deleteCartResult = await hardDeleteCart(cartId);
    
    if (!deleteCartResult.success) {
      return {
        success: false,
        error: deleteCartResult.error || "Failed to delete cart",
      };
    }

    return {
      success: true,
    };
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
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }
  return await createCartForAdmin(input);
}

/**
 * Merge a guest cart into the authenticated user's cart on login.
 *
 * Scenarios:
 * 1. Both user cart and guest cart exist →
 *    Move all guest cart items into user cart (merging duplicate quantities),
 *    assign the guest cart's user_id to the logged-in user, then hard-delete the guest cart.
 *
 * 2. Only user cart exists → nothing to do (guest had no cart).
 *
 * 3. Only guest cart exists →
 *    Create a new cart for the user, move all guest items into it,
 *    assign the guest cart's user_id to the logged-in user, then hard-delete the guest cart.
 *
 * 4. Neither exists → nothing to do.
 *
 * @returns success flag with optional message about what happened.
 */
export async function mergeGuestCartToUserService(
  userId: string,
  sessionId: string,
): Promise<{ success: boolean; error?: string; merged: boolean }> {
  try {
    // 1. Check for user's active cart
    const userCartCheck = await hasActiveCart(userId);
    if (!userCartCheck.success) {
      return {
        success: false,
        error: userCartCheck.error || "Failed to check user cart",
        merged: false,
      };
    }

    // 2. Check for guest's active cart by session_id
    const guestCartCheck = await hasActiveCartBySessionId(sessionId);
    if (!guestCartCheck.success) {
      return {
        success: false,
        error: guestCartCheck.error || "Failed to check guest cart",
        merged: false,
      };
    }

    const userCart = userCartCheck.hasActiveCart ? userCartCheck.data : null;
    const guestCart = guestCartCheck.hasActiveCart ? guestCartCheck.data : null;

    // ── Scenario 2 & 4: no guest cart – nothing to merge ──
    if (!guestCart) {
      return { success: true, merged: false };
    }

    // ── Scenario 1: both carts exist – merge guest → user ──
    if (userCart && guestCart) {
      // Move items (handles duplicate customised_product_id by merging quantities)
      const moveResult = await moveCartItemsToCart(guestCart.id, userCart.id);
      if (!moveResult.success) {
        return {
          success: false,
          error: moveResult.error || "Failed to move cart items",
          merged: false,
        };
      }

      // Assign the guest cart to this user (ownership record)
      await updateCartUserId(guestCart.id, userId);

      // Hard-delete the guest cart
      await deleteCartAdmin(guestCart.id);

      return { success: true, merged: true };
    }

    // ── Scenario 3: only guest cart exists – create user cart, move items ──
    if (!userCart && guestCart) {
      // Create a new cart for the authenticated user
      const newCartResult = await createCart(userId, {});
      if (!newCartResult.success || !newCartResult.data) {
        return {
          success: false,
          error: newCartResult.error || "Failed to create user cart",
          merged: false,
        };
      }

      const newUserCart = newCartResult.data;

      // Move items from guest cart to the new user cart
      const moveResult = await moveCartItemsToCart(guestCart.id, newUserCart.id);
      if (!moveResult.success) {
        return {
          success: false,
          error: moveResult.error || "Failed to move cart items",
          merged: false,
        };
      }

      // Assign the guest cart to this user (ownership record)
      await updateCartUserId(guestCart.id, userId);

      // Hard-delete the guest cart
      await deleteCartAdmin(guestCart.id);

      return { success: true, merged: true };
    }

    return { success: true, merged: false };
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
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

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
