import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../helpers/mocks";

const getCurrentUserProfile = vi.fn();
const getAnalyticsStats = vi.fn();

vi.mock("@/services/profile.service", () => ({
  getCurrentUserProfile: (...args: unknown[]) => getCurrentUserProfile(...args),
}));

vi.mock("@/repositories/analytics.repository", () => ({
  getSalesAndOrdersByMonth: vi.fn(),
  getUserGrowthByMonth: vi.fn(),
  getOrderStatusBreakdown: vi.fn(),
  getPaymentStatusBreakdown: vi.fn(),
  getAnalyticsStats: (...args: unknown[]) => getAnalyticsStats(...args),
  getTopProductsByRevenue: vi.fn(),
}));

describe("analytics.service Result envelope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("getAnalyticsStatsService returns ok:false for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { getAnalyticsStatsService } = await import(
      "@/services/analytics.service"
    );
    const result = await getAnalyticsStatsService();
    expect(result).toEqual({ ok: false, error: "Unauthorized" });
    expect(getAnalyticsStats).not.toHaveBeenCalled();
  });

  it("getAnalyticsStatsService returns ok:true for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    const stats = {
      totalUsers: 1,
      totalProducts: 2,
      totalOrders: 3,
      totalRevenue: 4,
      activeCarts: 5,
      pendingReviews: 0,
      pendingContactUs: 0,
      lowStockProducts: 0,
      averageOrderValue: 0,
    };
    getAnalyticsStats.mockResolvedValue(stats);
    const { getAnalyticsStatsService } = await import(
      "@/services/analytics.service"
    );
    const result = await getAnalyticsStatsService();
    expect(result).toEqual({ ok: true, data: stats });
  });
});
