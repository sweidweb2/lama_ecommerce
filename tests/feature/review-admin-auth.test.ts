import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../helpers/mocks";

const getCurrentUserProfile = vi.fn();
const getAllReviewsForAdmin = vi.fn();
const listReviewsForAdmin = vi.fn();
const getAdminReviewStats = vi.fn();

vi.mock("@/services/profile.service", () => ({
  getCurrentUserProfile: (...args: unknown[]) => getCurrentUserProfile(...args),
  getAdminShopBlockForUserId: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/repositories/review.repository", () => ({
  createReview: vi.fn(),
  createReviewForAdmin: vi.fn(),
  getProductReviews: vi.fn(),
  getAllReviewsForAdmin: (...args: unknown[]) => getAllReviewsForAdmin(...args),
  listReviewsForAdmin: (...args: unknown[]) => listReviewsForAdmin(...args),
  getAdminReviewStats: (...args: unknown[]) => getAdminReviewStats(...args),
  updateReview: vi.fn(),
  deleteReview: vi.fn(),
}));

describe("review.service admin list gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("getAllReviewsForAdminService throws for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { getAllReviewsForAdminService } = await import(
      "@/services/review.service"
    );
    await expect(getAllReviewsForAdminService()).rejects.toThrow("Unauthorized");
    expect(getAllReviewsForAdmin).not.toHaveBeenCalled();
  });

  it("getAllReviewsForAdminService reaches repo for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    getAllReviewsForAdmin.mockResolvedValue([{ id: "r1" }]);
    const { getAllReviewsForAdminService } = await import(
      "@/services/review.service"
    );
    await expect(getAllReviewsForAdminService()).resolves.toEqual([{ id: "r1" }]);
  });

  it("listReviewsForAdminService reaches repo for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    listReviewsForAdmin.mockResolvedValue({ items: [{ id: "r1" }], total: 1 });
    const { listReviewsForAdminService } = await import(
      "@/services/review.service"
    );
    await expect(
      listReviewsForAdminService({ page: 1, pageSize: 20 }),
    ).resolves.toEqual({ items: [{ id: "r1" }], total: 1 });
  });

  it("getAdminReviewStatsService reaches repo for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    getAdminReviewStats.mockResolvedValue({
      total: 4,
      pending: 1,
      approved: 2,
      rejected: 1,
      avgRating: "4.5",
    });
    const { getAdminReviewStatsService } = await import(
      "@/services/review.service"
    );
    await expect(getAdminReviewStatsService()).resolves.toEqual({
      total: 4,
      pending: 1,
      approved: 2,
      rejected: 1,
      avgRating: "4.5",
    });
  });
});
