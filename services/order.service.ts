import {
  getOrdersByUserId,
  getOrderCountByUserId,
  getOrdersBySessionId,
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
  softDeleteOrderAdmin,
  softDeleteOrderItemsByOrderId,
} from "@/repositories/order.repository";
import type { AdminOrderRow } from "@/repositories/order.repository";
import type { Order, OrderItem, Payment, Shipment } from "@/types/order";
import { getCurrentUserProfile } from "@/services/profile.service";
import { canAccessAdmin } from "@/lib/auth/permissions";

/** Composite return type for a full order detail view. */
export interface OrderDetails {
  order: Order;
  items: OrderItem[];
  payment: Payment | null;
  shipment: Shipment | null;
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
 * Get full order details (order + items + payment + shipment) for public/user views.
 *
 * Ownership is enforced:
 * - If userId is provided, the order must belong to that user.
 * - If sessionId is provided (guest), the order must match that session_id and have no user_id.
 * - If neither matches, returns null (forbidden / not found).
 */
/**
 * Get full order details for a user or guest.
 * - Authenticated: RLS-scoped fetch by user_id.
 * - Guest: service-role fetch + session ownership check (guest rows denied by RLS).
 */
export async function getOrderDetails(
  orderId: string,
  userId: string | null,
  sessionId: string | null,
): Promise<OrderDetails | null> {
  if (userId) {
    const order = await getOrderById(orderId);
    if (!order) return null;
    if (order.user_id !== userId) return null;

    const [items, payment, shipment] = await Promise.all([
      getOrderItemsByOrderId(orderId),
      getPaymentByOrderId(orderId),
      getShipmentByOrderId(orderId),
    ]);

    return { order, items, payment, shipment };
  }

  if (sessionId) {
    // Guest orders are not readable via anon RLS — use admin + ownership check
    const order = await getOrderByIdForAdmin(orderId);
    if (!order) return null;
    if (order.user_id !== null || order.session_id !== sessionId) return null;

    const [items, payment, shipment] = await Promise.all([
      getOrderItemsByOrderIdForAdmin(orderId),
      getPaymentByOrderIdForAdmin(orderId),
      getShipmentByOrderIdForAdmin(orderId),
    ]);

    return { order, items, payment, shipment };
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

  const [items, payment, shipment] = await Promise.all([
    getOrderItemsByOrderIdForAdmin(orderId),
    getPaymentByOrderIdForAdmin(orderId),
    getShipmentByOrderIdForAdmin(orderId),
  ]);

  return { order, items, payment, shipment };
}

/**
 * Update an order (admin use).
 * Validates input before updating.
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

    // Call repository to update the order
    return await updateOrder(orderId, input);
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
 * Delete an order (admin use) - soft delete order and its order items.
 * Validates input and ensures both order and items are soft-deleted.
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

    // First, soft-delete all order items
    const itemsResult = await softDeleteOrderItemsByOrderId(orderId);
    if (!itemsResult.success) {
      return {
        success: false,
        error: itemsResult.error || "Failed to delete order items",
      };
    }

    // Then, soft-delete the order itself
    const orderResult = await softDeleteOrderAdmin(orderId);
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
