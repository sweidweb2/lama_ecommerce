import { beforeEach, describe, expect, it, vi } from "vitest";

const getAllShippingZonesWithFee = vi.fn();
const processCheckout = vi.fn();
const incrementPurchaseCountForOrderService = vi.fn();
const createAddressForUser = vi.fn();
const updateAddressForUser = vi.fn();
const getAddressesByUserId = vi.fn();

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

vi.mock("@/services/order_email.service", () => ({
  sendOrderConfirmationEmailService: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/address.service", () => ({
  createAddressForUser: (...args: unknown[]) => createAddressForUser(...args),
  updateAddressForUser: (...args: unknown[]) => updateAddressForUser(...args),
  getAddressesByUserId: (...args: unknown[]) => getAddressesByUserId(...args),
}));

vi.mock("@/services/profile.service", () => ({
  getAdminShopBlockForUserId: vi.fn().mockResolvedValue(null),
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

const savedAddressId = "dddddddd-eeee-ffff-0000-111111111111";

describe("checkoutService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    incrementPurchaseCountForOrderService.mockResolvedValue(undefined);
    getAllShippingZonesWithFee.mockResolvedValue([
      { id: baseInput.shipping_zone_id, name: "Amman", fee: 4.5 },
    ]);
    processCheckout.mockResolvedValue({
      success: true,
      orderId: "order-1",
    });
    getAddressesByUserId.mockResolvedValue([]);
    createAddressForUser.mockResolvedValue({
      ok: true,
      data: { id: savedAddressId },
    });
    updateAddressForUser.mockResolvedValue({ id: savedAddressId });
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

  it("passes shipping_zone_id into processCheckout (fee resolved in SQL)", async () => {
    const { checkoutService } = await import("@/services/checkout.service");
    const result = await checkoutService(baseInput);

    expect(result).toEqual({ success: true, orderId: "order-1" });
    expect(processCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        cart_id: baseInput.cart_id,
        user_id: baseInput.user_id,
        session_id: baseInput.session_id,
        shipping_zone_id: baseInput.shipping_zone_id,
        email: baseInput.email,
      }),
    );
    // Money fields must not be passed — RPC resolves fee from zone id
    expect(processCheckout.mock.calls[0][0]).not.toHaveProperty("shipping_fee");
    expect(processCheckout.mock.calls[0][0]).not.toHaveProperty("discount");
    expect(processCheckout.mock.calls[0][0]).not.toHaveProperty("total");
    expect(processCheckout.mock.calls[0][0]).not.toHaveProperty("subtotal");
  });

  it("passes guest session_id through without inventing a user_id", async () => {
    getAllShippingZonesWithFee.mockResolvedValue([
      { id: baseInput.shipping_zone_id, name: "Amman", fee: 2 },
    ]);
    processCheckout.mockResolvedValue({ success: true, orderId: "order-guest" });

    const guestInput = {
      ...baseInput,
      user_id: null,
      session_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    };
    const { checkoutService } = await import("@/services/checkout.service");
    await checkoutService(guestInput);

    expect(processCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: null,
        session_id: guestInput.session_id,
        cart_id: guestInput.cart_id,
        shipping_zone_id: guestInput.shipping_zone_id,
      }),
    );
  });

  it("surfaces stock race errors from processCheckout", async () => {
    processCheckout.mockResolvedValue({
      success: false,
      error:
        'Stock race condition for "Tee": stock changed since validation',
    });

    const { checkoutService } = await import("@/services/checkout.service");
    await expect(checkoutService(baseInput)).resolves.toEqual({
      success: false,
      error:
        'Stock race condition for "Tee": stock changed since validation',
    });
  });

  it("maps thrown stock race exceptions to failure result", async () => {
    processCheckout.mockRejectedValue(
      new Error('Stock race condition for "Tee": stock changed since validation'),
    );

    const { checkoutService } = await import("@/services/checkout.service");
    await expect(checkoutService(baseInput)).resolves.toEqual({
      success: false,
      error:
        'Stock race condition for "Tee": stock changed since validation',
    });
  });

  it("allows checkout when zone fee is null (SQL treats as 0)", async () => {
    getAllShippingZonesWithFee.mockResolvedValue([
      { id: baseInput.shipping_zone_id, name: "Free", fee: null },
    ]);
    processCheckout.mockResolvedValue({ success: true, orderId: "order-2" });

    const { checkoutService } = await import("@/services/checkout.service");
    await checkoutService(baseInput);

    expect(processCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        shipping_zone_id: baseInput.shipping_zone_id,
      }),
    );
    expect(processCheckout.mock.calls[0][0]).not.toHaveProperty("shipping_fee");
  });

  it("does not touch address book when save_address is false", async () => {
    const { checkoutService } = await import("@/services/checkout.service");
    const result = await checkoutService({
      ...baseInput,
      save_address: false,
    });

    expect(result).toEqual({ success: true, orderId: "order-1" });
    expect(createAddressForUser).not.toHaveBeenCalled();
    expect(updateAddressForUser).not.toHaveBeenCalled();
  });

  it("creates address after checkout and returns addressSaved true", async () => {
    const { checkoutService } = await import("@/services/checkout.service");
    const result = await checkoutService({
      ...baseInput,
      save_address: true,
      save_address_mode: "create",
    });

    expect(result).toEqual({
      success: true,
      orderId: "order-1",
      addressSaved: true,
    });
    expect(getAddressesByUserId).toHaveBeenCalledWith(baseInput.user_id);
    expect(createAddressForUser).toHaveBeenCalledWith(baseInput.user_id, {
      country: baseInput.address.country,
      city: baseInput.address.city,
      address: baseInput.address.address,
      postal_code: baseInput.address.postal_code,
      phone: baseInput.phone,
      is_default: true,
    });
    expect(updateAddressForUser).not.toHaveBeenCalled();
  });

  it("returns addressSaved false when create fails but order still succeeds", async () => {
    createAddressForUser.mockResolvedValue({
      ok: false,
      error: "Failed to save address",
    });

    const { checkoutService } = await import("@/services/checkout.service");
    const result = await checkoutService({
      ...baseInput,
      save_address: true,
    });

    expect(result).toEqual({
      success: true,
      orderId: "order-1",
      addressSaved: false,
    });
  });

  it("updates selected address when save_address_mode is update", async () => {
    const { checkoutService } = await import("@/services/checkout.service");
    const result = await checkoutService({
      ...baseInput,
      save_address: true,
      save_address_mode: "update",
      saved_address_id: savedAddressId,
    });

    expect(result).toEqual({
      success: true,
      orderId: "order-1",
      addressSaved: true,
    });
    expect(updateAddressForUser).toHaveBeenCalledWith(
      baseInput.user_id,
      savedAddressId,
      {
        country: baseInput.address.country,
        city: baseInput.address.city,
        address: baseInput.address.address,
        postal_code: baseInput.address.postal_code,
        phone: baseInput.phone,
      },
    );
    expect(createAddressForUser).not.toHaveBeenCalled();
  });

  it("returns addressSaved false when update returns null", async () => {
    updateAddressForUser.mockResolvedValue(null);

    const { checkoutService } = await import("@/services/checkout.service");
    const result = await checkoutService({
      ...baseInput,
      save_address: true,
      save_address_mode: "update",
      saved_address_id: savedAddressId,
    });

    expect(result).toEqual({
      success: true,
      orderId: "order-1",
      addressSaved: false,
    });
    expect(createAddressForUser).not.toHaveBeenCalled();
  });
});
