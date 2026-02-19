"use server";

import { revalidatePath } from "next/cache";
import { encryptOrderId } from "@/lib/utils/encryption";
import { deleteOrderService, updateOrderService } from "@/services/order.service";
import type { OrderStatus, PaymentStatus } from "@/types/order";

/**
 * Server action to encrypt an order ID.
 * Used by client components that need to encrypt order IDs for URLs.
 */
export async function encryptOrderIdAction(orderId: string): Promise<string> {
  try {
    return encryptOrderId(orderId);
  } catch (error) {
    console.error("Error encrypting order ID:", error);
    throw new Error("Failed to encrypt order ID");
  }
}

/**
 * Server action to update an order.
 * Updates order fields like status, payment_status, shipping_fee, etc.
 */
export async function updateOrderAction(
  orderId: string,
  input: {
    status?: OrderStatus;
    payment_status?: PaymentStatus;
    shipping_fee?: number | null;
    discount?: number | null;
    total?: number | null;
    phone?: string | null;
    email?: string | null;
  },
): Promise<{ success: boolean; error?: string; data?: any }> {
  const result = await updateOrderService(orderId, input);

  // Revalidate orders pages on success
  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
  }

  return result;
}

/**
 * Server action to delete an order (soft delete).
 * Deletes the order and all its order items.
 */
export async function deleteOrderAction(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await deleteOrderService(orderId);

  // Revalidate orders pages on success
  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
  }

  return result;
}
