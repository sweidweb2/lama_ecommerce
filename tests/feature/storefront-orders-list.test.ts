import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/types/order";

const getOrdersByUserId = vi.fn();
const getOrdersBySessionId = vi.fn();

vi.mock("@/services/profile.service", () => ({
  getCurrentUserProfile: vi.fn(),
  getAdminShopBlockForUserId: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/repositories/promo_code.repository", () => ({
  getPromoCodeByIdAdmin: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/repositories/order.repository", () => ({
  getOrdersByUserId: (...args: unknown[]) => getOrdersByUserId(...args),
  getOrderCountByUserId: vi.fn(),
  getOrdersBySessionId: (...args: unknown[]) => getOrdersBySessionId(...args),
  claimOrdersBySessionId: vi.fn(),
  getOrderById: vi.fn(),
  getOrderByIdForAdmin: vi.fn(),
  getOrderItemsByOrderId: vi.fn(),
  getOrderItemsByOrderIdForAdmin: vi.fn(),
  getPaymentByOrderId: vi.fn(),
  getPaymentByOrderIdForAdmin: vi.fn(),
  getShipmentByOrderId: vi.fn(),
  getShipmentByOrderIdForAdmin: vi.fn(),
  getAllOrdersForAdmin: vi.fn(),
  updateOrder: vi.fn(),
  deleteOrderAdmin: vi.fn(),
  countPaymentsByOrderId: vi.fn(),
  countShipmentsByOrderId: vi.fn(),
}));

function order(partial: Partial<Order> & Pick<Order, "id">): Order {
  return {
    user_id: null,
    session_id: null,
    status: "pending",
    payment_status: "pending",
    subtotal: 10,
    shipping_fee: 0,
    discount: 0,
    total: 10,
    email: null,
    phone: null,
    address_snapshot: null,
    shipping_zone_id: null,
    shipping_zone_name: null,
    promo_code_id: null,
    stock_restored: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("getStorefrontOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns empty when neither userId nor sessionId", async () => {
    const { getStorefrontOrders } = await import("@/services/order.service");
    await expect(getStorefrontOrders(null, null)).resolves.toEqual([]);
    expect(getOrdersByUserId).not.toHaveBeenCalled();
    expect(getOrdersBySessionId).not.toHaveBeenCalled();
  });

  it("returns user orders only when authenticated without cookie", async () => {
    const userOrder = order({
      id: "user-order",
      user_id: "user-1",
      created_at: "2026-01-02T00:00:00.000Z",
    });
    getOrdersByUserId.mockResolvedValue([userOrder]);
    const { getStorefrontOrders } = await import("@/services/order.service");

    const result = await getStorefrontOrders("user-1", null);

    expect(result).toEqual([userOrder]);
    expect(getOrdersByUserId).toHaveBeenCalledWith("user-1", undefined);
    expect(getOrdersBySessionId).not.toHaveBeenCalled();
  });

  it("returns session orders only for guest", async () => {
    const guestOrder = order({
      id: "guest-order",
      session_id: "sess-1",
      user_id: null,
    });
    getOrdersBySessionId.mockResolvedValue([guestOrder]);
    const { getStorefrontOrders } = await import("@/services/order.service");

    const result = await getStorefrontOrders(null, "sess-1");

    expect(result).toEqual([guestOrder]);
    expect(getOrdersBySessionId).toHaveBeenCalledWith("sess-1", undefined);
    expect(getOrdersByUserId).not.toHaveBeenCalled();
  });

  it("unions user and unclaimed session orders while cookie present", async () => {
    const userOrder = order({
      id: "user-order",
      user_id: "user-1",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    const guestOrder = order({
      id: "guest-order",
      session_id: "sess-1",
      user_id: null,
      created_at: "2026-01-03T00:00:00.000Z",
    });
    getOrdersByUserId.mockResolvedValue([userOrder]);
    getOrdersBySessionId.mockResolvedValue([guestOrder]);
    const { getStorefrontOrders } = await import("@/services/order.service");

    const result = await getStorefrontOrders("user-1", "sess-1");

    expect(result.map((o) => o.id)).toEqual(["guest-order", "user-order"]);
    expect(getOrdersByUserId).toHaveBeenCalledWith("user-1", undefined);
    expect(getOrdersBySessionId).toHaveBeenCalledWith("sess-1", undefined);
  });

  it("dedupes by id preferring the user-owned row", async () => {
    const claimedAsUser = order({
      id: "same-id",
      user_id: "user-1",
      session_id: "sess-1",
      created_at: "2026-01-02T00:00:00.000Z",
    });
    const staleSessionCopy = order({
      id: "same-id",
      user_id: null,
      session_id: "sess-1",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    getOrdersByUserId.mockResolvedValue([claimedAsUser]);
    getOrdersBySessionId.mockResolvedValue([staleSessionCopy]);
    const { getStorefrontOrders } = await import("@/services/order.service");

    const result = await getStorefrontOrders("user-1", "sess-1");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(claimedAsUser);
  });
});
