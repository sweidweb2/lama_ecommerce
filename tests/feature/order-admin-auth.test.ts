import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../helpers/mocks";

const getCurrentUserProfile = vi.fn();
const getAllOrdersForAdmin = vi.fn();
const getOrderByIdForAdmin = vi.fn();
const getOrderItemsByOrderIdForAdmin = vi.fn();
const getPaymentByOrderIdForAdmin = vi.fn();
const getShipmentByOrderIdForAdmin = vi.fn();
const updateOrder = vi.fn();
const softDeleteOrderItemsByOrderId = vi.fn();
const softDeleteOrderAdmin = vi.fn();

vi.mock("@/services/profile.service", () => ({
  getCurrentUserProfile: (...args: unknown[]) => getCurrentUserProfile(...args),
}));

vi.mock("@/repositories/order.repository", () => ({
  getOrdersByUserId: vi.fn(),
  getOrderCountByUserId: vi.fn(),
  getOrdersBySessionId: vi.fn(),
  getOrderById: vi.fn(),
  getOrderByIdForAdmin: (...args: unknown[]) => getOrderByIdForAdmin(...args),
  getOrderItemsByOrderId: vi.fn(),
  getOrderItemsByOrderIdForAdmin: (...args: unknown[]) =>
    getOrderItemsByOrderIdForAdmin(...args),
  getPaymentByOrderId: vi.fn(),
  getPaymentByOrderIdForAdmin: (...args: unknown[]) =>
    getPaymentByOrderIdForAdmin(...args),
  getShipmentByOrderId: vi.fn(),
  getShipmentByOrderIdForAdmin: (...args: unknown[]) =>
    getShipmentByOrderIdForAdmin(...args),
  getAllOrdersForAdmin: (...args: unknown[]) => getAllOrdersForAdmin(...args),
  updateOrder: (...args: unknown[]) => updateOrder(...args),
  softDeleteOrderAdmin: (...args: unknown[]) => softDeleteOrderAdmin(...args),
  softDeleteOrderItemsByOrderId: (...args: unknown[]) =>
    softDeleteOrderItemsByOrderId(...args),
}));

describe("order.service admin authz", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAdminOrders returns [] for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { getAdminOrders } = await import("@/services/order.service");
    await expect(getAdminOrders()).resolves.toEqual([]);
    expect(getAllOrdersForAdmin).not.toHaveBeenCalled();
  });

  it("getAdminOrderDetails returns null for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { getAdminOrderDetails } = await import("@/services/order.service");
    await expect(getAdminOrderDetails("order-1")).resolves.toBeNull();
    expect(getOrderByIdForAdmin).not.toHaveBeenCalled();
  });

  it("updateOrderService returns Forbidden for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { updateOrderService } = await import("@/services/order.service");
    await expect(
      updateOrderService("order-1", { status: "processing" }),
    ).resolves.toEqual({ success: false, error: "Forbidden" });
    expect(updateOrder).not.toHaveBeenCalled();
  });

  it("deleteOrderService returns Forbidden for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { deleteOrderService } = await import("@/services/order.service");
    await expect(deleteOrderService("order-1")).resolves.toEqual({
      success: false,
      error: "Forbidden",
    });
    expect(softDeleteOrderAdmin).not.toHaveBeenCalled();
  });

  it("updateOrderService reaches repository for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    updateOrder.mockResolvedValue({ success: true, data: { id: "order-1" } });
    const { updateOrderService } = await import("@/services/order.service");
    const result = await updateOrderService("order-1", { status: "packed" });
    expect(result.success).toBe(true);
    expect(updateOrder).toHaveBeenCalledWith("order-1", { status: "packed" });
  });

  it("getAdminOrders reaches repository for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    getAllOrdersForAdmin.mockResolvedValue([{ id: "order-1" }]);
    const { getAdminOrders } = await import("@/services/order.service");
    await expect(getAdminOrders()).resolves.toEqual([{ id: "order-1" }]);
    expect(getAllOrdersForAdmin).toHaveBeenCalled();
  });
});
