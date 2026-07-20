/**
 * Canonical admin metric definitions shared by Dashboard and Analytics.
 * Keep queries and UI labels in sync via these constants.
 */

export const LOW_STOCK_MIN = 1;
export const LOW_STOCK_MAX = 10;

/** Order statuses excluded from revenue / order-count KPIs. */
export const REVENUE_EXCLUDED_STATUSES = ["cancelled"] as const;

export type RevenueExcludedStatus = (typeof REVENUE_EXCLUDED_STATUSES)[number];

export const METRIC_LABELS = {
  activeUsers: "Active users",
  activeProducts: "Active products",
  totalCarts: "Total carts",
  lowStockVariants: "Low stock variants",
  lowStockVariantsWithRange: `Low stock variants (${LOW_STOCK_MIN}–${LOW_STOCK_MAX})`,
  outOfStock: "Out of stock",
} as const;

export function isRevenueEligibleStatus(status: string): boolean {
  return !(REVENUE_EXCLUDED_STATUSES as readonly string[]).includes(status);
}
