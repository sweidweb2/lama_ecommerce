import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getDashboardStats,
  getRecentOrders,
  getRecentUsers,
  getLowStockItems,
  getPendingReviewsPreview,
  getUnansweredQuestionsPreview,
  getRecentContacts,
  getTopSellingProducts,
  getOrderStatusBreakdown,
  type DashboardStats,
  type RecentOrder,
  type RecentUser,
  type LowStockItem,
  type PendingReviewItem,
  type UnansweredQuestionItem,
  type RecentContactItem,
  type TopProductItem,
  type OrderStatusBreakdown,
} from "@/repositories/dashboard.repository";

const EMPTY_DASHBOARD_STATS: DashboardStats = {
  totalUsers: 0,
  totalProducts: 0,
  totalOrdersThisMonth: 0,
  revenueThisMonth: 0,
  pendingOrders: 0,
  processingOrders: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
  unansweredQA: 0,
  pendingReviews: 0,
  newContacts: 0,
  activeCarts: 0,
  newLeadsThisMonth: 0,
};

export type {
  DashboardStats,
  RecentOrder,
  RecentUser,
  LowStockItem,
  PendingReviewItem,
  UnansweredQuestionItem,
  RecentContactItem,
  TopProductItem,
  OrderStatusBreakdown,
};

export async function getDashboardStatsService(): Promise<DashboardStats> {
  try {
    await requireAdmin();
  } catch {
    return EMPTY_DASHBOARD_STATS;
  }
  return getDashboardStats();
}

export async function getRecentOrdersService(
  limit: number = 5,
): Promise<RecentOrder[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getRecentOrders(limit);
}

export async function getRecentUsersService(
  limit: number = 5,
): Promise<RecentUser[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getRecentUsers(limit);
}

export async function getLowStockItemsService(
  limit: number = 8,
): Promise<LowStockItem[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getLowStockItems(limit);
}

export async function getPendingReviewsPreviewService(
  limit: number = 5,
): Promise<PendingReviewItem[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getPendingReviewsPreview(limit);
}

export async function getUnansweredQuestionsPreviewService(
  limit: number = 5,
): Promise<UnansweredQuestionItem[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getUnansweredQuestionsPreview(limit);
}

export async function getRecentContactsService(
  limit: number = 5,
): Promise<RecentContactItem[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getRecentContacts(limit);
}

export async function getTopSellingProductsService(
  limit: number = 5,
): Promise<TopProductItem[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getTopSellingProducts(limit);
}

export async function getOrderStatusBreakdownService(): Promise<
  OrderStatusBreakdown[]
> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getOrderStatusBreakdown();
}
