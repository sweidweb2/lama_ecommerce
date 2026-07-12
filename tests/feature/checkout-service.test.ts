import { beforeEach, describe, expect, it, vi } from "vitest";

const getAllShippingZonesWithFee = vi.fn();
const processCheckout = vi.fn();
const incrementPurchaseCountForOrderService = vi.fn();

vi.mock("@/repositories/shipping_zone.repository", () => ({
  getAllShippingZonesWithFee: (...args: unknown[]) =>
    getAllShippingZonesWithFee(...args),
}));

vi.mock("@/repositories/order.repository", () => ({
  processCheckout: (...args: unknown[]) => processCheckout(...args),
}));

vi.mock("@/services/product_view.service", () => ({
  incrementPurchaseCountForOrderService: (...args: unknown[]) =>
    incrementPurchaseCountForOrderService(...args),
}));

const baseInput = {
  cart_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  user_id: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
  session_id: null as string | null,
  shipping_zone_id: "cccccccc-dddd-eeee-ffff-000000000000",
  address: {
    country: "JO",
    city: "Amman",
    address: "Street 1",
    postal_code: "111",
  },
  phone: "0790000000",
  email: "buyer@example.com",
};

describe("checkoutService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    incrementPurchaseCountForOrderService.mockResolvedValue(undefined);
  });

  it("rejects unknown shipping zone", async () => {
    getAllShippingZonesWithFee.mockResolvedValue([]);
    const { checkoutService } = await import("@/services/checkout.service");
    await expect(checkoutService(baseInput)).resolves.toEqual({
      success: false,
      error: "Invalid shipping zone selected.",
    });
    expect(processCheckout).not.toHaveBeenCalled();
  });

  it("passes server-resolved shipping fee into processCheckout", async () => {
    getAllShippingZonesWithFee.mockResolvedValue([
      { id: baseInput.shipping_zone_id, name: "Amman", fee: 4.5 },
    ]);
    processCheckout.mockResolvedValue({
      success: true,
      orderId: "order-1",
    });

    const { checkoutService } = await import("@/services/checkout.service");
    const result = await checkoutService(baseInput);

    expect(result).toEqual({ success: true, orderId: "order-1" });
    expect(processCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        cart_id: baseInput.cart_id,
        shipping_fee: 4.5,
        discount: 0,
        email: baseInput.email,
      }),
    );
    // Input has no client total/subtotal fields — only zone id drives fee
    expect(processCheckout.mock.calls[0][0]).not.toHaveProperty("total");
    expect(processCheckout.mock.calls[0][0]).not.toHaveProperty("subtotal");
  });

  it("uses fee 0 when zone fee is null", async () => {
    getAllShippingZonesWithFee.mockResolvedValue([
      { id: baseInput.shipping_zone_id, name: "Free", fee: null },
    ]);
    processCheckout.mockResolvedValue({ success: true, orderId: "order-2" });

    const { checkoutService } = await import("@/services/checkout.service");
    await checkoutService(baseInput);

    expect(processCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ shipping_fee: 0 }),
    );
  });
});
