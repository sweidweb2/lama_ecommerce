import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile } from "../helpers/mocks";

const requireAdmin = vi.fn();
const getAllProductViewsForAdmin = vi.fn();
const getProductViewsStats = vi.fn();
const trackProductView = vi.fn();
const incrementProductViewsCount = vi.fn();
const getProductVariantById = vi.fn();
const incrementProductAddToCartCount = vi.fn();
const getOrderItemsByOrderIdForAdmin = vi.fn();
const incrementProductPurchaseCount = vi.fn();

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/repositories/product_view.repository", () => ({
  getAllProductViewsForAdmin: (...args: unknown[]) =>
    getAllProductViewsForAdmin(...args),
  getProductViewsByProductIdForAdmin: vi.fn(),
  getProductViewsStats: (...args: unknown[]) => getProductViewsStats(...args),
  getProductViewsStatsByProductId: vi.fn(),
  trackProductView: (...args: unknown[]) => trackProductView(...args),
  incrementProductViewsCount: (...args: unknown[]) =>
    incrementProductViewsCount(...args),
  incrementProductAddToCartCount: (...args: unknown[]) =>
    incrementProductAddToCartCount(...args),
  incrementProductPurchaseCount: (...args: unknown[]) =>
    incrementProductPurchaseCount(...args),
  getProductStatsByProductId: vi.fn(),
}));

vi.mock("@/repositories/product_variant.repository", () => ({
  getProductVariantById: (...args: unknown[]) => getProductVariantById(...args),
}));

vi.mock("@/repositories/order.repository", () => ({
  getOrderItemsByOrderIdForAdmin: (...args: unknown[]) =>
    getOrderItemsByOrderIdForAdmin(...args),
}));

const productId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const variantId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

describe("product_view.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin views helpers return empty for non-admin", async () => {
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const {
      getAllProductViewsForAdminService,
      getProductViewsStatsService,
    } = await import("@/services/product_view.service");

    await expect(getAllProductViewsForAdminService(1, 50)).resolves.toEqual({
      data: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 0,
    });
    await expect(getProductViewsStatsService()).resolves.toEqual({
      totalViews: 0,
      uniqueProducts: 0,
      uniqueUsers: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
      viewsThisMonth: 0,
    });
    expect(getAllProductViewsForAdmin).not.toHaveBeenCalled();
  });

  it("trackProductViewService rejects invalid product id", async () => {
    const { trackProductViewService } = await import(
      "@/services/product_view.service"
    );
    await expect(
      trackProductViewService("", null, null),
    ).resolves.toEqual({ success: false, error: "Invalid product ID" });
  });

  it("trackProductViewService tracks then increments views", async () => {
    trackProductView.mockResolvedValue({ success: true });
    incrementProductViewsCount.mockResolvedValue({ success: true });
    const { trackProductViewService } = await import(
      "@/services/product_view.service"
    );
    await expect(
      trackProductViewService(productId, null, "session-1"),
    ).resolves.toEqual({ success: true });
    expect(trackProductView).toHaveBeenCalledWith(
      productId,
      null,
      "session-1",
    );
    expect(incrementProductViewsCount).toHaveBeenCalledWith(productId);
  });

  it("incrementProductAddToCartService resolves product from variant", async () => {
    getProductVariantById.mockResolvedValue({
      id: variantId,
      product_id: productId,
    });
    incrementProductAddToCartCount.mockResolvedValue({ success: true });
    const { incrementProductAddToCartService } = await import(
      "@/services/product_view.service"
    );
    await expect(
      incrementProductAddToCartService(variantId),
    ).resolves.toEqual({ success: true });
    expect(incrementProductAddToCartCount).toHaveBeenCalledWith(productId);
  });

  it("incrementPurchaseCountForOrderService aggregates by product", async () => {
    getOrderItemsByOrderIdForAdmin.mockResolvedValue([
      { customised_product_id: variantId, quantity: 2 },
      { customised_product_id: variantId, quantity: 1 },
    ]);
    getProductVariantById.mockResolvedValue({
      id: variantId,
      product_id: productId,
    });
    incrementProductPurchaseCount.mockResolvedValue({ success: true });

    const { incrementPurchaseCountForOrderService } = await import(
      "@/services/product_view.service"
    );
    await expect(
      incrementPurchaseCountForOrderService("order-1"),
    ).resolves.toEqual({ success: true });
    expect(incrementProductPurchaseCount).toHaveBeenCalledWith(productId, 3);
  });

  it("admin stats reach repo for admin", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    getProductViewsStats.mockResolvedValue({
      totalViews: 10,
      uniqueProducts: 2,
      uniqueUsers: 3,
      viewsToday: 1,
      viewsThisWeek: 4,
      viewsThisMonth: 10,
    });
    const { getProductViewsStatsService } = await import(
      "@/services/product_view.service"
    );
    await expect(getProductViewsStatsService()).resolves.toMatchObject({
      totalViews: 10,
    });
  });
});
