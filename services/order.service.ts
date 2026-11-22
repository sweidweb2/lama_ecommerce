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
  countShipmentsByOrderId,
  type UpsertPaymentForOrderInput,
} from "@/repositories/order.repository";
import { createShipment } from "@/repositories/shipment.repository";
import { getPromoCodeByIdAdmin } from "@/repositories/promo_code.repository";
import type { AdminOrderRow } from "@/repositories/order.repository";
import type { Order, OrderItem, Payment, Shipment } from "@/types/order";
import { getAdminShopBlockForUserId } from "@/services/profile.service";
import { requireAdmin } from "@/lib/auth/require-admin";
import { verifyOrderAccessToken } from "@/lib/auth/order-access-token";
import { createShipmentSchema } from "@/lib/validators/shipment/create";
import { canTransitionOrderStatus } from "@/lib/admin/order-status-transitions";

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
 * Storefront order list for `/orders`.
 * - Auth only: user-owned orders.
 * - Guest only: unclaimed session orders.
 * - Auth + guest cookie: union both (covers pre-claim / claim-fail window).
 * Session rows are already `user_id IS NULL`; on id collision, user row wins.
 */
export async function getStorefrontOrders(
  userId: string | null,
  sessionId: string | null,
): Promise<Order[]> {
  if (!userId && !sessionId) return [];

  if (userId && !sessionId) {
    return getUserOrders(userId);
  }

  if (!userId && sessionId) {
    return getSessionOrders(sessionId);
  }

  const [userOrders, sessionOrders] = await Promise.all([
    getUserOrders(userId!),
    getSessionOrders(sessionId!),
  ]);

  const byId = new Map<string, Order>();
  for (const order of sessionOrders) {
    byId.set(order.id, order);
  }
  for (const order of userOrders) {
    byId.set(order.id, order);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0;
    const bTime = b.created_at ? Date.parse(b.created_at) : 0;
    return bTime - aTime;
  });
}

/**
 * Attach guest orders for a session to a user account (login handoff).
 * Only claims when checkout email matches userEmail (case-insensitive).
 * Idempotent; uses service-role claim under the hood.
 */
export async function claimGuestOrdersService(
  userId: string,
  sessionId: string,
  userEmail: string | null | undefined,
): Promise<{ success: boolean; error?: string; claimedCount: number }> {
  const shopBlock = await getAdminShopBlockForUserId(userId);
  if (shopBlock) {
    return { success: false, error: shopBlock, claimedCount: 0 };
  }
  return claimOrdersBySessionId(sessionId, userId, userEmail ?? "");
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
  try {
    await requireAdmin();
  } catch {
    return [];
  }
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
  try {
    await requireAdmin();
  } catch {
    return null;
  }

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
    carrier_name?: string;
    tracking_number?: string;
  },
): Promise<{ success: boolean; error?: string; data?: Order }> {
  try {
    try {
      await requireAdmin();
    } catch {
      return { success: false, error: "Forbidden" };
    }

    // Phone and email are set at checkout and must not change via admin update.

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

    const existing = await getOrderByIdForAdmin(orderId);
    if (!existing) {
      return { success: false, error: "Order not found" };
    }

    if (
      input.status !== undefined &&
      !canTransitionOrderStatus(existing.status, input.status)
    ) {
      return {
        success: false,
        error: `Cannot change status from "${existing.status}" to "${input.status}"`,
      };
    }

    let needsShipment = false;
    if (input.status === "shipped") {
      const shipmentCount = await countShipmentsByOrderId(orderId);
      if (!shipmentCount.success) {
        return {
          success: false,
          error: shipmentCount.error ?? "Failed to check shipments",
        };
      }
      needsShipment = shipmentCount.count === 0;
    }

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

      const statusResult = await updateOrder(orderId, {
        user_id: input.user_id,
        status: input.status,
        payment_status: input.payment_status,
        subtotal: input.subtotal,
        shipping_fee: input.shipping_fee,
        discount: input.discount,
        total: input.total,
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

    // Call repository to update the order (phone/email intentionally omitted)
    return await updateOrder(orderId, {
      user_id: input.user_id,
      status: input.status,
      payment_status: input.payment_status,
      subtotal: input.subtotal,
      shipping_fee: input.shipping_fee,
      discount: input.discount,
      total: input.total,
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
    try {
      await requireAdmin();
    } catch {
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
 * Delete an order (admin use) — hard delete.
 * Payments, shipments, and order items cascade with the order.
 * If stock was never restored, cancel first so the restock trigger runs.
 */
export async function deleteOrderService(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      await requireAdmin();
    } catch {
      return { success: false, error: "Forbidden" };
    }

    if (!orderId || typeof orderId !== "string" || orderId.trim() === "") {
      return {
        success: false,
        error: "Invalid order ID",
      };
    }

    const order = await getOrderByIdForAdmin(orderId);
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (!order.stock_restored) {
      const cancelResult = await updateOrder(orderId, { status: "cancelled" });
      if (!cancelResult.success) {
        return {
          success: false,
          error:
            cancelResult.error || "Failed to restore stock before delete",
        };
      }
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
