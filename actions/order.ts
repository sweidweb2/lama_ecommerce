"use server";

import { revalidatePath } from "next/cache";
import { encryptOrderId } from "@/lib/utils/encryption";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  deleteOrderService,
  updateOrderService,
  upsertOrderPaymentAdmin,
} from "@/services/order.service";
import { upsertPaymentSchema } from "@/lib/validators/payment/upsert";
import type { OrderStatus, PaymentStatus } from "@/types/order";

/**
 * Unauthenticated URL helper: encrypt an order ID for client-side redirects
 * (e.g. post-checkout navigation to `/order_details/{ciphertext}`).
 *
 * Anyone can call this to build a URL; encryption alone is **not** access control.
 * Order details still require ownership (auth user or matching guest session).
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
 * When marking as shipped, pass carrier_name + tracking_number to create a shipment.
 */
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  shipment?: { carrier_name: string; tracking_number: string },
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

  const result = await updateOrderService(orderId, {
    status,
    carrier_name: shipment?.carrier_name,
    tracking_number: shipment?.tracking_number,
  });

  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath("/admin/orders/[id]", "page");
  }

  return { success: result.success, error: result.error };
}

/**
 * Admin-only: upsert payment row and sync orders.payment_status.
 */
export async function upsertOrderPaymentAction(
  raw: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const parsed = upsertPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstKey = Object.keys(fieldErrors)[0] as keyof typeof fieldErrors | undefined;
    const firstError = firstKey ? fieldErrors[firstKey]?.[0] : undefined;
    return { success: false, error: firstError ?? "Invalid payment data" };
  }

  const result = await upsertOrderPaymentAdmin(parsed.data);

  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${parsed.data.order_id}`);
    revalidatePath(`/admin/orders/${parsed.data.order_id}/order_payment`);
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
