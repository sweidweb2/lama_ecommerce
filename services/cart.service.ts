import {
  createCart,
  hasActiveCart,
  getCartByUserId,
  getAllCartsForAdmin,
  getCartByIdForAdmin,
  deleteCart,
  hardDeleteCart,
  type Cart,
  type AdminCartRow,
} from "@/repositories/cart.repository";
import {
  createCartItem,
  getCartItemsWithProductsByCartId,
  getCartItemsWithProductsByCartIdForAdmin,
  hardDeleteCartItem,
  hardDeleteCartItemsByCartId,
  type CartItem,
  type CartItemWithProduct,
} from "@/repositories/cart_item.repository";
import { createCartItemSchema } from "@/lib/validators/cart-item/create";

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

    // Add item to cart
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
 * Hard delete a cart item.
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
 * Delete cart service.
 * Soft-deletes a cart by setting deleted_at.
 */
export async function deleteCartService(
  cartId: string,
): Promise<{ success: boolean; error?: string }> {
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
