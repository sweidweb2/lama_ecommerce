import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrderDetails = vi.fn();
const getCurrentAuthUserFromComponent = vi.fn();
const getGuestSessionId = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/services/order.service", () => ({
  getOrderDetails: (...args: unknown[]) => getOrderDetails(...args),
}));

vi.mock("@/repositories/auth.repository", () => ({
  getCurrentAuthUserFromComponent: (...args: unknown[]) =>
    getCurrentAuthUserFromComponent(...args),
}));

vi.mock("@/lib/auth/guest-session", () => ({
  getGuestSessionId: (...args: unknown[]) => getGuestSessionId(...args),
}));

vi.mock("next/navigation", () => ({
  notFound: (...args: unknown[]) => notFound(...args),
}));

describe("Order invoice page ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentAuthUserFromComponent.mockResolvedValue({ id: "user-1" });
    getGuestSessionId.mockResolvedValue("sess-1");
  });

  it("calls notFound when getOrderDetails returns null", async () => {
    getOrderDetails.mockResolvedValue(null);
    const { default: OrderInvoicePage } = await import(
      "@/app/(public)/orders/[id]/invoice/page"
    );

    await expect(
      OrderInvoicePage({
        params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getOrderDetails).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      "user-1",
      "sess-1",
      null,
    );
    expect(notFound).toHaveBeenCalled();
  });

  it("renders invoice content when ownership passes", async () => {
    getOrderDetails.mockResolvedValue({
      order: {
        id: "11111111-1111-1111-1111-111111111111",
        status: "processing",
        payment_status: "paid",
        email: "guest@example.com",
        phone: null,
        address_snapshot: {
          address: "1 Main St",
          city: "Cairo",
          country: "EG",
        },
        subtotal: 100,
        shipping_fee: 10,
        discount: 0,
        total: 110,
        shipping_zone_name: null,
        created_at: "2026-07-01T12:00:00.000Z",
      },
      items: [
        {
          id: "item-1",
          product_name_snapshot: "Tee",
          size_snapshot: "M",
          color_snapshot: "Black",
          material_snapshot: null,
          quantity: 2,
          price_snapshot: 50,
        },
      ],
      payment: {
        status: "paid",
        payment_method: "card",
        gateway: "stripe",
        amount: 110,
      },
      promo_code: null,
      shipment: null,
    });

    const { default: OrderInvoicePage } = await import(
      "@/app/(public)/orders/[id]/invoice/page"
    );

    const element = await OrderInvoicePage({
      params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" }),
    });

    expect(element).toBeTruthy();
    expect(getOrderDetails).toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();
  });
});
