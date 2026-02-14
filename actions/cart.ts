"use server";

import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import {
  addItemToCartService,
  addItemToCartByIdService,
  getUserCartService,
  getUserCartWithItemsService,
  deleteCartItemService,
  deleteCartService,
  hardDeleteCartService,
  updateCartItemService,
  createCartForAdminService,
} from "@/services/cart.service";
import { revalidatePath } from "next/cache";

/**
 * Add item to cart action.
 * This is the server action called from client components.
 * 
 * Flow:
 * 1. Check if user is authenticated
 * 2. Check if user has an active cart
 * 3. If not, create a new cart
 * 4. Add the cart item to the cart (new or existing)
 */
export async function addItemToCartAction(input: {
  customised_product_id: string;
  quantity: number;
}): Promise<{ success: boolean; error?: string; data?: any }> {
  // Authorization check: User must be logged in
  const user = await getCurrentAuthUserFromAction();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to add items to your cart",
    };
  }

  // Call service to add item to cart
  const result = await addItemToCartService(user.id, input);

  // Revalidate cart-related pages if successful
  if (result.success) {
    revalidatePath("/cart");
    revalidatePath("/checkout");
  }

  return result;
}

/**
 * Get user's cart action.
 * This is the server action called from client components.
 */
export async function getUserCartAction(): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  // Authorization check: User must be logged in
  const user = await getCurrentAuthUserFromAction();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to view your cart",
    };
  }

  // Call service to get user's cart
  const result = await getUserCartService(user.id);

  return result;
}

/**
 * Get user's cart with items action.
 * This is the server action called from server components.
 */
export async function getUserCartWithItemsAction(): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  // Authorization check: User must be logged in
  const user = await getCurrentAuthUserFromAction();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to view your cart",
    };
  }

  // Call service to get user's cart with items
  const result = await getUserCartWithItemsService(user.id);

  return result;
}

/**
 * Delete cart item action.
 * This is the server action called from client components.
 * Hard deletes the cart item from the database.
 */
export async function deleteCartItemAction(
  cartItemId: string,
): Promise<{ success: boolean; error?: string }> {
  // Authorization check: User must be logged in
  const user = await getCurrentAuthUserFromAction();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to delete cart items",
    };
  }

  // Call service to delete cart item
  const result = await deleteCartItemService(cartItemId);

  // Revalidate cart page if successful
  if (result.success) {
    revalidatePath("/cart");
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
  // Authorization check: User must be logged in (admin check should be done in UI)
  const user = await getCurrentAuthUserFromAction();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to delete carts",
    };
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
  // Authorization check: User must be logged in (admin check should be done in UI)
  const user = await getCurrentAuthUserFromAction();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to delete carts",
    };
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
  // Authorization check: User must be logged in (admin check should be done in UI)
  const user = await getCurrentAuthUserFromAction();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to add items to cart",
    };
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
 * Update cart item action (admin use).
 * This is the server action called from client components (admin panel).
 * Updates the quantity of a cart item.
 */
export async function updateCartItemAction(
  cartItemId: string,
  quantity: number,
  cartId: string,
): Promise<{ success: boolean; error?: string; data?: any }> {
  // Authorization check: User must be logged in (admin check should be done in UI)
  const user = await getCurrentAuthUserFromAction();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to update cart items",
    };
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
  // Authorization check: User must be logged in (admin check should be done in UI)
  const user = await getCurrentAuthUserFromAction();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to create carts",
    };
  }

  // Call service to create cart
  const result = await createCartForAdminService(input);

  // Revalidate admin carts pages if successful
  if (result.success) {
    revalidatePath("/admin/carts");
  }

  return result;
}
