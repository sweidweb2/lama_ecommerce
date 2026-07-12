"use server";

import { revalidatePath } from "next/cache";
import { encryptOrderId } from "@/lib/utils/encryption";
import { requireAdmin } from "@/lib/auth/require-admin";
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
 * Admin-only: update an order.
 * Storefront/checkout must never set payment_status — checkout leaves it
 * `pending`; only admin (and later a Stripe webhook) may change it.
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
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const result = await updateOrderService(orderId, input);

  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath("/admin/orders/[id]", "page");
  }

  return result;
}

/**
 * Admin-only: update order fulfillment status.
 */
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const validStatuses: OrderStatus[] = [
    "pending",
    "processing",
    "packed",
    "shipped",
    "delivered",
    "returned",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    return { success: false, error: "Invalid order status" };
  }

  const result = await updateOrderService(orderId, { status });

  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath("/admin/orders/[id]", "page");
  }

  return { success: result.success, error: result.error };
}

/**
 * Admin-only: soft-delete an order and its items.
 */
export async function deleteOrderAction(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const result = await deleteOrderService(orderId);

  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
  }

  return result;
}
