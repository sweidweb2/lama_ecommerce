import {
  getDashboardStats,
  getRecentOrders,
  getRecentUsers,
  type DashboardStats,
  type RecentOrder,
  type RecentUser,
} from "@/repositories/dashboard.repository";

/**
 * Get dashboard statistics
 */
export async function getDashboardStatsService(): Promise<DashboardStats> {
  return getDashboardStats();
}

/**
 * Get recent orders
 */
export async function getRecentOrdersService(limit: number = 5): Promise<RecentOrder[]> {
  return getRecentOrders(limit);
}

/**
 * Get recent users
 */
export async function getRecentUsersService(limit: number = 5): Promise<RecentUser[]> {
  return getRecentUsers(limit);
}
