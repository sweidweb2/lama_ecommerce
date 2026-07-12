import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getDashboardStats,
  getRecentOrders,
  getRecentUsers,
  type DashboardStats,
  type RecentOrder,
  type RecentUser,
} from "@/repositories/dashboard.repository";

const EMPTY_DASHBOARD_STATS: DashboardStats = {
  totalUsers: 0,
  totalProducts: 0,
  totalOrdersThisMonth: 0,
  revenueThisMonth: 0,
  pendingOrders: 0,
  lowStockItems: 0,
  unansweredQA: 0,
  pendingReviews: 0,
};

/**
 * Get dashboard statistics
 */
export async function getDashboardStatsService(): Promise<DashboardStats> {
  try {
    await requireAdmin();
  } catch {
    return EMPTY_DASHBOARD_STATS;
  }
  return getDashboardStats();
}

/**
 * Get recent orders
 */
export async function getRecentOrdersService(limit: number = 5): Promise<RecentOrder[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getRecentOrders(limit);
}

/**
 * Get recent users
 */
export async function getRecentUsersService(limit: number = 5): Promise<RecentUser[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getRecentUsers(limit);
}
