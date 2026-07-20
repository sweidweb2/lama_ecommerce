import type { OrderStatus } from "@/types/order";

/**
 * Allowed order status transitions for admin fulfillment.
 * No reverse moves; no skips on the main chain.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned", "cancelled"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return true;
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuses selectable in admin UI (current + allowed next). */
export function getAllowedOrderStatuses(from: OrderStatus): OrderStatus[] {
  const next = ORDER_STATUS_TRANSITIONS[from] ?? [];
  return [from, ...next.filter((s) => s !== from)];
}
