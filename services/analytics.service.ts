import { requireAdmin } from "@/lib/auth/require-admin";
import type { AdminDateRange } from "@/lib/admin/date-range";
import {
  getSalesAndOrdersByMonth,
  getUserGrowthByMonth,
  getOrderStatusBreakdown,
  getPaymentStatusBreakdown,
  getAnalyticsStats,
  getTopProductsByRevenue,
  type AnalyticsStats,
} from "@/repositories/analytics.repository";

const EMPTY_STATS: AnalyticsStats = {
  totalUsers: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalRevenue: 0,
  activeCarts: 0,
  pendingReviews: 0,
  pendingContactUs: 0,
  lowStockProducts: 0,
  averageOrderValue: 0,
};

/**
 * Get sales and orders data by month
 */
export async function getSalesAndOrdersByMonthService(range?: AdminDateRange) {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return await getSalesAndOrdersByMonth(range);
}

/**
 * Get user growth data by month
 */
export async function getUserGrowthByMonthService(range?: AdminDateRange) {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return await getUserGrowthByMonth(range);
}

/**
 * Get order status breakdown
 */
export async function getOrderStatusBreakdownService() {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return await getOrderStatusBreakdown();
}

/**
 * Get payment status breakdown
 */
export async function getPaymentStatusBreakdownService() {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return await getPaymentStatusBreakdown();
}

/**
 * Get overall analytics statistics
 */
export async function getAnalyticsStatsService(
  range?: AdminDateRange,
): Promise<AnalyticsStats> {
  try {
    await requireAdmin();
  } catch {
    return EMPTY_STATS;
  }
  return await getAnalyticsStats(range);
}

/**
 * Get top products by revenue
 */
export async function getTopProductsByRevenueService(
  limit: number = 10,
  range?: AdminDateRange,
) {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return await getTopProductsByRevenue(limit, range);
}
