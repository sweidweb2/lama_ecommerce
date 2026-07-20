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

export type DashboardResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

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

async function withAdminResult<T>(
  load: () => Promise<T>,
): Promise<DashboardResult<T>> {
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
      error instanceof Error ? error.message : "Failed to load dashboard data";
    console.error("Dashboard service error:", error);
    return { ok: false, error: message };
  }
}

export async function getDashboardStatsService(): Promise<
  DashboardResult<DashboardStats>
> {
  return withAdminResult(getDashboardStats);
}

export async function getRecentOrdersService(
  limit: number = 5,
): Promise<DashboardResult<RecentOrder[]>> {
  return withAdminResult(() => getRecentOrders(limit));
}

export async function getRecentUsersService(
  limit: number = 5,
): Promise<DashboardResult<RecentUser[]>> {
  return withAdminResult(() => getRecentUsers(limit));
}

export async function getLowStockItemsService(
  limit: number = 8,
): Promise<DashboardResult<LowStockItem[]>> {
  return withAdminResult(() => getLowStockItems(limit));
}

export async function getPendingReviewsPreviewService(
  limit: number = 5,
): Promise<DashboardResult<PendingReviewItem[]>> {
  return withAdminResult(() => getPendingReviewsPreview(limit));
}

export async function getUnansweredQuestionsPreviewService(
  limit: number = 5,
): Promise<DashboardResult<UnansweredQuestionItem[]>> {
  return withAdminResult(() => getUnansweredQuestionsPreview(limit));
}

export async function getRecentContactsService(
  limit: number = 5,
): Promise<DashboardResult<RecentContactItem[]>> {
  return withAdminResult(() => getRecentContacts(limit));
}

export async function getTopSellingProductsService(
  limit: number = 5,
): Promise<DashboardResult<TopProductItem[]>> {
  return withAdminResult(() => getTopSellingProducts(limit));
}

export async function getOrderStatusBreakdownService(): Promise<
  DashboardResult<OrderStatusBreakdown[]>
> {
  return withAdminResult(getOrderStatusBreakdown);
}
