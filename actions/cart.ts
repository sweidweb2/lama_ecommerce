"use server";

import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import {
  addItemToCartService,
  getUserCartService,
  getUserCartWithItemsService,
  deleteCartItemService,
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
