import {
  getOrdersByUserId,
  getOrderCountByUserId,
  getOrdersBySessionId,
  claimOrdersBySessionId,
  getOrderById,
  getOrderByIdForAdmin,
  getOrderItemsByOrderId,
  getOrderItemsByOrderIdForAdmin,
  getPaymentByOrderId,
  getPaymentByOrderIdForAdmin,
  getShipmentByOrderId,
  getShipmentByOrderIdForAdmin,
  getAllOrdersForAdmin,
  updateOrder,
  upsertPaymentForOrder,
  deleteOrderAdmin,
  countPaymentsByOrderId,
  countShipmentsByOrderId,
  type UpsertPaymentForOrderInput,
} from "@/repositories/order.repository";
import { createShipment } from "@/repositories/shipment.repository";
import { getPromoCodeByIdAdmin } from "@/repositories/promo_code.repository";
import type { AdminOrderRow } from "@/repositories/order.repository";
import type { Order, OrderItem, Payment, Shipment } from "@/types/order";
import { getCurrentUserProfile } from "@/services/profile.service";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { verifyOrderAccessToken } from "@/lib/auth/order-access-token";
import { createShipmentSchema } from "@/lib/validators/shipment/create";

/** Composite return type for a full order detail view. */
export interface OrderDetails {
  order: Order;
  items: OrderItem[];
  payment: Payment | null;
  shipment: Shipment | null;
  /** Applied promo code string when promo_code_id resolves; null otherwise. */
  promo_code: string | null;
}

async function resolvePromoCode(
  promoCodeId: string | null | undefined,
): Promise<string | null> {
  if (!promoCodeId) return null;
  const promo = await getPromoCodeByIdAdmin(promoCodeId);
  return promo?.code ?? null;
}

/**
 * Get orders for a specific user (newest first).
 */
export async function getUserOrders(
  userId: string,
  limit?: number,
): Promise<Order[]> {
  return getOrdersByUserId(userId, limit);
}

/**
 * Get orders for a guest session (newest first).
 */
export async function getSessionOrders(
  sessionId: string,
  limit?: number,
): Promise<Order[]> {
  return getOrdersBySessionId(sessionId, limit);
}

/**
 * Attach guest orders for a session to a user account (login handoff).
 * Idempotent; uses service-role claim under the hood.
 */
export async function claimGuestOrdersService(
  userId: string,
  sessionId: string,
): Promise<{ success: boolean; error?: string; claimedCount: number }> {
  return claimOrdersBySessionId(sessionId, userId);
}

/**
 * Get order count for a specific user.
 */
export async function getUserOrderCount(userId: string): Promise<number> {
  return getOrderCountByUserId(userId);
}

/**
 * Get all orders for the admin panel (newest first) with user names.
 */
export async function getAdminOrders(): Promise<AdminOrderRow[]> {
  const profile = await getCurrentUserProfile();
  if (!profile || !canAccessAdmin(profile.role)) return [];
  return getAllOrdersForAdmin();
}

/**
 * Get full order details for a user or guest.
 * - Authenticated: RLS-scoped fetch by user_id.
 * - If auth ownership fails and sessionId is present, fall through to guest session check
 *   (covers logged-in users who still have the guest cookie before/without a successful claim).
 * - Guest: service-role fetch + session ownership check (guest rows denied by RLS).
 * - Signed access token (`t`): bearer capability for that orderId (email / find-order links).
 */
export async function getOrderDetails(
  orderId: string,
  userId: string | null,
  sessionId: string | null,
  accessToken?: string | null,
): Promise<OrderDetails | null> {
  if (userId) {
    const order = await getOrderById(orderId);
    if (order && order.user_id === userId) {
      const [items, payment, shipment, promo_code] = await Promise.all([
        getOrderItemsByOrderId(orderId),
        getPaymentByOrderId(orderId),
        getShipmentByOrderId(orderId),
        resolvePromoCode(order.promo_code_id),
      ]);

      return { order, items, payment, shipment, promo_code };
    }
    // Fall through to guest session / token when auth ownership misses
  }

  if (sessionId) {
    // Guest orders are not readable via anon RLS — use admin + ownership check
    const order = await getOrderByIdForAdmin(orderId);
    if (order && order.user_id === null && order.session_id === sessionId) {
      const [items, payment, shipment, promo_code] = await Promise.all([
        getOrderItemsByOrderIdForAdmin(orderId),
        getPaymentByOrderIdForAdmin(orderId),
        getShipmentByOrderIdForAdmin(orderId),
        resolvePromoCode(order.promo_code_id),
      ]);

      return { order, items, payment, shipment, promo_code };
    }
    // Fall through to signed token when session ownership misses
  }

  if (accessToken && verifyOrderAccessToken(accessToken, orderId)) {
    const order = await getOrderByIdForAdmin(orderId);
    if (!order) return null;

    const [items, payment, shipment, promo_code] = await Promise.all([
      getOrderItemsByOrderIdForAdmin(orderId),
      getPaymentByOrderIdForAdmin(orderId),
      getShipmentByOrderIdForAdmin(orderId),
      resolvePromoCode(order.promo_code_id),
    ]);

    return { order, items, payment, shipment, promo_code };
  }

  return null;
}

/**
 * Get full order details for admin views.
 * Uses admin client to bypass RLS and include deleted orders and their items.
 * Does NOT enforce user/session ownership.
 */
export async function getAdminOrderDetails(
  orderId: string,
): Promise<OrderDetails | null> {
  const profile = await getCurrentUserProfile();
  if (!profile || !canAccessAdmin(profile.role)) return null;

  const order = await getOrderByIdForAdmin(orderId);
  if (!order) return null;

  const [items, payment, shipment, promo_code] = await Promise.all([
    getOrderItemsByOrderIdForAdmin(orderId),
    getPaymentByOrderIdForAdmin(orderId),
    getShipmentByOrderIdForAdmin(orderId),
    resolvePromoCode(order.promo_code_id),
  ]);

  return { order, items, payment, shipment, promo_code };
}

/**
 * Update an order (admin use).
 * Validates input before updating.
 * When status → shipped and no shipment exists yet, requires carrier + tracking
 * and creates a shipments row (rolls back status if insert fails).
 */
export async function updateOrderService(
  orderId: string,
  input: {
    user_id?: string | null;
    status?: Order["status"];
    payment_status?: Order["payment_status"];
    subtotal?: number | null;
    shipping_fee?: number | null;
    discount?: number | null;
    total?: number | null;
    phone?: string | null;
    email?: string | null;
    carrier_name?: string;
    tracking_number?: string;
  },
): Promise<{ success: boolean; error?: string; data?: Order }> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || !canAccessAdmin(profile.role)) {
      return { success: false, error: "Forbidden" };
    }

    // Basic validation
    if (input.email !== undefined && input.email !== null && input.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        return {
          success: false,
          error: "Invalid email format",
        };
      }
    }

    if (input.subtotal !== undefined && input.subtotal !== null && input.subtotal < 0) {
      return {
        success: false,
        error: "Subtotal cannot be negative",
      };
    }

    if (input.shipping_fee !== undefined && input.shipping_fee !== null && input.shipping_fee < 0) {
      return {
        success: false,
        error: "Shipping fee cannot be negative",
      };
    }

    if (input.discount !== undefined && input.discount !== null && input.discount < 0) {
      return {
        success: false,
        error: "Discount cannot be negative",
      };
    }

    if (input.total !== undefined && input.total !== null && input.total < 0) {
      return {
        success: false,
        error: "Total cannot be negative",
      };
    }

    const needsShipment =
      input.status === "shipped" &&
      (await countShipmentsByOrderId(orderId)) === 0;

    if (needsShipment) {
      const shipmentParsed = createShipmentSchema.safeParse({
        order_id: orderId,
        carrier_name: input.carrier_name ?? "",
        tracking_number: input.tracking_number ?? "",
      });
      if (!shipmentParsed.success) {
        const fieldErrors = shipmentParsed.error.flatten().fieldErrors;
        const firstKey = Object.keys(fieldErrors)[0] as
          | keyof typeof fieldErrors
          | undefined;
        const firstError = firstKey ? fieldErrors[firstKey]?.[0] : undefined;
        return {
          success: false,
          error: firstError ?? "Carrier and tracking number are required to mark as shipped",
        };
      }

      const existing = await getOrderByIdForAdmin(orderId);
      if (!existing) {
        return { success: false, error: "Order not found" };
      }

      const statusResult = await updateOrder(orderId, {
        user_id: input.user_id,
        status: input.status,
        payment_status: input.payment_status,
        subtotal: input.subtotal,
        shipping_fee: input.shipping_fee,
        discount: input.discount,
        total: input.total,
        phone: input.phone,
        email: input.email,
      });

      if (!statusResult.success) {
        return statusResult;
      }

      const shipmentResult = await createShipment({
        order_id: orderId,
        carrier_name: shipmentParsed.data.carrier_name,
        tracking_number: shipmentParsed.data.tracking_number,
      });

      if (!shipmentResult.success) {
        // Roll back status so we never leave shipped without a shipment row
        await updateOrder(orderId, { status: existing.status });
        return {
          success: false,
          error: shipmentResult.error ?? "Failed to create shipment",
        };
      }

      return statusResult;
    }

    // Call repository to update the order
    return await updateOrder(orderId, {
      user_id: input.user_id,
      status: input.status,
      payment_status: input.payment_status,
      subtotal: input.subtotal,
      shipping_fee: input.shipping_fee,
      discount: input.discount,
      total: input.total,
      phone: input.phone,
      email: input.email,
    });
  } catch (error) {
    console.error("Error in updateOrderService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update order",
    };
  }
}

/**
 * Upsert payment for an order and sync orders.payment_status (admin).
 */
export async function upsertOrderPaymentAdmin(
  input: UpsertPaymentForOrderInput,
): Promise<{ success: boolean; error?: string; data?: Payment }> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || !canAccessAdmin(profile.role)) {
      return { success: false, error: "Forbidden" };
    }
    return await upsertPaymentForOrder(input);
  } catch (error) {
    console.error("Error in upsertOrderPaymentAdmin:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save payment",
    };
  }
}

/**
 * Delete an order (admin use) - hard delete.
 * Refuses if payments or shipments exist; order items cascade with the order.
 */
export async function deleteOrderService(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || !canAccessAdmin(profile.role)) {
      return { success: false, error: "Forbidden" };
    }

    // Validate order ID
    if (!orderId || typeof orderId !== "string" || orderId.trim() === "") {
      return {
        success: false,
        error: "Invalid order ID",
      };
    }

    const paymentCount = await countPaymentsByOrderId(orderId);
    if (paymentCount > 0) {
      return {
        success: false,
        error: "Cannot delete order with existing payments",
      };
    }

    const shipmentCount = await countShipmentsByOrderId(orderId);
    if (shipmentCount > 0) {
      return {
        success: false,
        error: "Cannot delete order with existing shipments",
      };
    }

    const orderResult = await deleteOrderAdmin(orderId);
    if (!orderResult.success) {
      return {
        success: false,
        error: orderResult.error || "Failed to delete order",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteOrderService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete order",
    };
  }
}
