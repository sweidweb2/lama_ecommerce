import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrderById = vi.fn();
const getOrderByIdForAdmin = vi.fn();
const getOrderItemsByOrderId = vi.fn();
const getOrderItemsByOrderIdForAdmin = vi.fn();
const getPaymentByOrderId = vi.fn();
const getPaymentByOrderIdForAdmin = vi.fn();
const getShipmentByOrderId = vi.fn();
const getShipmentByOrderIdForAdmin = vi.fn();

vi.mock("@/services/profile.service", () => ({
  getCurrentUserProfile: vi.fn(),
}));

vi.mock("@/repositories/order.repository", () => ({
  getOrdersByUserId: vi.fn(),
  getOrderCountByUserId: vi.fn(),
  getOrdersBySessionId: vi.fn(),
  getOrderById: (...args: unknown[]) => getOrderById(...args),
  getOrderByIdForAdmin: (...args: unknown[]) => getOrderByIdForAdmin(...args),
  getOrderItemsByOrderId: (...args: unknown[]) => getOrderItemsByOrderId(...args),
  getOrderItemsByOrderIdForAdmin: (...args: unknown[]) =>
    getOrderItemsByOrderIdForAdmin(...args),
  getPaymentByOrderId: (...args: unknown[]) => getPaymentByOrderId(...args),
  getPaymentByOrderIdForAdmin: (...args: unknown[]) =>
    getPaymentByOrderIdForAdmin(...args),
  getShipmentByOrderId: (...args: unknown[]) => getShipmentByOrderId(...args),
  getShipmentByOrderIdForAdmin: (...args: unknown[]) =>
    getShipmentByOrderIdForAdmin(...args),
  getAllOrdersForAdmin: vi.fn(),
  updateOrder: vi.fn(),
  deleteOrderAdmin: vi.fn(),
  countPaymentsByOrderId: vi.fn(),
  countShipmentsByOrderId: vi.fn(),
}));

describe("getOrderDetails ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrderItemsByOrderId.mockResolvedValue([]);
    getOrderItemsByOrderIdForAdmin.mockResolvedValue([]);
    getPaymentByOrderId.mockResolvedValue(null);
    getPaymentByOrderIdForAdmin.mockResolvedValue(null);
    getShipmentByOrderId.mockResolvedValue(null);
    getShipmentByOrderIdForAdmin.mockResolvedValue(null);
  });

  it("returns null when neither userId nor sessionId provided", async () => {
    const { getOrderDetails } = await import("@/services/order.service");
    await expect(getOrderDetails("order-1", null, null)).resolves.toBeNull();
  });

  it("returns null when authenticated user does not own the order", async () => {
    getOrderById.mockResolvedValue({ id: "order-1", user_id: "other-user" });
    const { getOrderDetails } = await import("@/services/order.service");
    await expect(
      getOrderDetails("order-1", "user-1", null),
    ).resolves.toBeNull();
  });

  it("returns details when authenticated user owns the order", async () => {
    const order = { id: "order-1", user_id: "user-1" };
    getOrderById.mockResolvedValue(order);
    const { getOrderDetails } = await import("@/services/order.service");
    const result = await getOrderDetails("order-1", "user-1", null);
    expect(result).toEqual({
      order,
      items: [],
      payment: null,
      shipment: null,
    });
    expect(getOrderByIdForAdmin).not.toHaveBeenCalled();
  });

  it("returns null for guest when order has a user_id", async () => {
    getOrderByIdForAdmin.mockResolvedValue({
      id: "order-1",
      user_id: "user-1",
      session_id: "sess-1",
    });
    const { getOrderDetails } = await import("@/services/order.service");
    await expect(
      getOrderDetails("order-1", null, "sess-1"),
    ).resolves.toBeNull();
  });

  it("returns null for guest when session_id mismatches", async () => {
    getOrderByIdForAdmin.mockResolvedValue({
      id: "order-1",
      user_id: null,
      session_id: "other-sess",
    });
    const { getOrderDetails } = await import("@/services/order.service");
    await expect(
      getOrderDetails("order-1", null, "sess-1"),
    ).resolves.toBeNull();
  });

  it("returns details for guest with matching session and no user_id", async () => {
    const order = {
      id: "order-1",
      user_id: null,
      session_id: "sess-1",
    };
    getOrderByIdForAdmin.mockResolvedValue(order);
    const { getOrderDetails } = await import("@/services/order.service");
    const result = await getOrderDetails("order-1", null, "sess-1");
    expect(result?.order).toEqual(order);
    expect(getOrderByIdForAdmin).toHaveBeenCalled();
  });
});
