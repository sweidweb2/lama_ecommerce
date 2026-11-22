/** Canonical order statuses used by admin UI, actions, and analytics. */
export const ORDER_STATUSES = [
  "pending",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;

export type OrderStatusConstant = (typeof ORDER_STATUSES)[number];
export type PaymentStatusConstant = (typeof PAYMENT_STATUSES)[number];
