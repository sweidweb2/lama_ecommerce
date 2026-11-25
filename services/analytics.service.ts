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

export type AnalyticsResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type { AnalyticsStats };

export type AnalyticsDashboardData = {
  sales: Array<{ month: string; sales: number; orders: number }>;
  userGrowth: Array<{ month: string; users: number }>;
  orderStatus: Array<{ status: string; count: number }>;
  paymentStatus: Array<{ status: string; count: number }>;
  stats: AnalyticsStats;
  topProducts: Array<{
    product_id: string;
    product_name: string;
    revenue: number;
    orders: number;
  }>;
};

async function withAdminResult<T>(
  load: () => Promise<T>,
): Promise<AnalyticsResult<T>> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const data = await load();
    return { ok: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load analytics data";
    console.error("Analytics service error:", error);
    return { ok: false, error: message };
  }
}

/**
 * Load the analytics dashboard in one auth gate + parallel repository calls.
 * Prefer this over calling the individual services from the page (avoids 6× requireAdmin).
 */
export async function getAnalyticsDashboardService(
  range?: AdminDateRange,
  topLimit: number = 10,
): Promise<AnalyticsResult<AnalyticsDashboardData>> {
  return withAdminResult(async () => {
    const [
      sales,
      userGrowth,
      orderStatus,
      paymentStatus,
      stats,
      topProducts,
    ] = await Promise.all([
      getSalesAndOrdersByMonth(range),
      getUserGrowthByMonth(range),
      getOrderStatusBreakdown(),
      getPaymentStatusBreakdown(),
      getAnalyticsStats(range),
      getTopProductsByRevenue(topLimit, range),
    ]);

    return {
      sales,
      userGrowth,
      orderStatus,
      paymentStatus,
      stats,
      topProducts,
    };
  });
}

/**
 * Get sales and orders data by month
 */
export async function getSalesAndOrdersByMonthService(
  range?: AdminDateRange,
): Promise<
  AnalyticsResult<Array<{ month: string; sales: number; orders: number }>>
> {
  return withAdminResult(() => getSalesAndOrdersByMonth(range));
}

/**
 * Get user growth data by month
 */
export async function getUserGrowthByMonthService(
  range?: AdminDateRange,
): Promise<AnalyticsResult<Array<{ month: string; users: number }>>> {
  return withAdminResult(() => getUserGrowthByMonth(range));
}

/**
 * Get order status breakdown
 */
export async function getOrderStatusBreakdownService(): Promise<
  AnalyticsResult<Array<{ status: string; count: number }>>
> {
  return withAdminResult(() => getOrderStatusBreakdown());
}

/**
 * Get payment status breakdown
 */
export async function getPaymentStatusBreakdownService(): Promise<
  AnalyticsResult<Array<{ status: string; count: number }>>
> {
  return withAdminResult(() => getPaymentStatusBreakdown());
}

/**
 * Get overall analytics statistics
 */
export async function getAnalyticsStatsService(
  range?: AdminDateRange,
): Promise<AnalyticsResult<AnalyticsStats>> {
  return withAdminResult(() => getAnalyticsStats(range));
}

/**
 * Get top products by revenue
 */
export async function getTopProductsByRevenueService(
  limit: number = 10,
  range?: AdminDateRange,
): Promise<
  AnalyticsResult<
    Array<{
      product_id: string;
      product_name: string;
      revenue: number;
      orders: number;
    }>
  >
> {
  return withAdminResult(() => getTopProductsByRevenue(limit, range));
}
