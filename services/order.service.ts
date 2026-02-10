import { getOrdersByUserId, getOrderCountByUserId } from "@/repositories/order.repository";
import type { Order } from "@/types/order";

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
 * Get order count for a specific user.
 */
export async function getUserOrderCount(userId: string): Promise<number> {
  return getOrderCountByUserId(userId);
}
