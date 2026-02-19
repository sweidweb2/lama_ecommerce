import {
  getSalesAndOrdersByMonth,
  getUserGrowthByMonth,
  getOrderStatusBreakdown,
  getPaymentStatusBreakdown,
  getAnalyticsStats,
  getTopProductsByRevenue,
  type AnalyticsStats,
} from "@/repositories/analytics.repository";

/**
 * Get sales and orders data by month
 */
export async function getSalesAndOrdersByMonthService() {
  return await getSalesAndOrdersByMonth();
}

/**
 * Get user growth data by month
 */
export async function getUserGrowthByMonthService() {
  return await getUserGrowthByMonth();
}

/**
 * Get order status breakdown
 */
export async function getOrderStatusBreakdownService() {
  return await getOrderStatusBreakdown();
}

/**
 * Get payment status breakdown
 */
export async function getPaymentStatusBreakdownService() {
  return await getPaymentStatusBreakdown();
}

/**
 * Get overall analytics statistics
 */
export async function getAnalyticsStatsService(): Promise<AnalyticsStats> {
  return await getAnalyticsStats();
}

/**
 * Get top products by revenue
 */
export async function getTopProductsByRevenueService(limit: number = 10) {
  return await getTopProductsByRevenue(limit);
}
