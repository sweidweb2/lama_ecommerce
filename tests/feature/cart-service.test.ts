import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile } from "../helpers/mocks";
import type { SessionContext } from "@/lib/auth/session-context";

const requireAdmin = vi.fn();
const getAdminShopBlockForUserId = vi.fn();
const hasActiveCartForSession = vi.fn();
const createCart = vi.fn();
const createCartItemForSession = vi.fn();
const updateCartItemForSession = vi.fn();
const hardDeleteCartItem = vi.fn();
const hardDeleteCartItemForSession = vi.fn();
const getAllCartsForAdmin = vi.fn();
const getCartByIdForAdmin = vi.fn();
const getCartItemsWithProductsByCartIdForAdmin = vi.fn();
const incrementProductAddToCartService = vi.fn();

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/services/profile.service", () => ({
  getAdminShopBlockForUserId: (...args: unknown[]) =>
    getAdminShopBlockForUserId(...args),
  getCurrentUserProfile: vi.fn(),
}));

vi.mock("@/repositories/cart.repository", () => ({
  createCart: (...args: unknown[]) => createCart(...args),
  createCartForAdmin: vi.fn(),
  hasActiveCartForSession: (...args: unknown[]) =>
    hasActiveCartForSession(...args),
  getCartForSession: vi.fn(),
  getAllCartsForAdmin: (...args: unknown[]) => getAllCartsForAdmin(...args),
  getCartByIdForAdmin: (...args: unknown[]) => getCartByIdForAdmin(...args),
  deleteCart: vi.fn(),
  hardDeleteCart: vi.fn(),
  mergeGuestCartToUser: vi.fn(),
  getUserIdsWithActiveCarts: vi.fn(),
}));

vi.mock("@/repositories/cart_item.repository", () => ({
  createCartItemAsAdmin: vi.fn(),
  createCartItemForSession: (...args: unknown[]) =>
    createCartItemForSession(...args),
  updateCartItemForSession: (...args: unknown[]) =>
    updateCartItemForSession(...args),
  hardDeleteCartItemForSession: (...args: unknown[]) =>
    hardDeleteCartItemForSession(...args),
  getCartItemsWithProductsByCartId: vi.fn(),
  getCartItemsWithProductsByCartIdForAdmin: (...args: unknown[]) =>
    getCartItemsWithProductsByCartIdForAdmin(...args),
  hardDeleteCartItem: (...args: unknown[]) => hardDeleteCartItem(...args),
  hardDeleteCartItemForAdmin: vi.fn(),
  hardDeleteCartItemsByCartId: vi.fn(),
  updateCartItem: vi.fn(),
  updateCartItemForAdmin: vi.fn(),
  moveCartItemsToCart: vi.fn(),
}));

vi.mock("@/services/product_view.service", () => ({
  incrementProductAddToCartService: (...args: unknown[]) =>
    incrementProductAddToCartService(...args),
}));

const userId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const variantId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
const cartId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";
const cartItemId = "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44";

const userSession: SessionContext = { kind: "user", userId };

describe("cart.service happy paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminShopBlockForUserId.mockResolvedValue(null);
    incrementProductAddToCartService.mockResolvedValue({ success: true });
  });

  it("addItemForSession creates cart then adds item", async () => {
    hasActiveCartForSession.mockResolvedValue({
      success: true,
      hasActiveCart: false,
    });
    createCart.mockResolvedValue({
      success: true,
      data: { id: cartId, user_id: userId },
    });
    createCartItemForSession.mockResolvedValue({
      success: true,
      data: {
        id: cartItemId,
        cart_id: cartId,
        customised_product_id: variantId,
        quantity: 2,
      },
    });

    const { addItemForSession } = await import("@/services/cart.service");
    const result = await addItemForSession(userSession, {
      customised_product_id: variantId,
      quantity: 2,
    });

    expect(result.success).toBe(true);
    expect(createCart).toHaveBeenCalledWith(userId, {});
    expect(createCartItemForSession).toHaveBeenCalledWith(userSession, {
      cart_id: cartId,
      customised_product_id: variantId,
      quantity: 2,
    });
  });

  it("addItemForSession reuses existing active cart", async () => {
    hasActiveCartForSession.mockResolvedValue({
      success: true,
      hasActiveCart: true,
      data: { id: cartId, user_id: userId },
    });
    createCartItemForSession.mockResolvedValue({
      success: true,
      data: { id: cartItemId, cart_id: cartId, quantity: 1 },
    });

    const { addItemForSession } = await import("@/services/cart.service");
    const result = await addItemForSession(userSession, {
      customised_product_id: variantId,
      quantity: 1,
    });

    expect(result.success).toBe(true);
    expect(createCart).not.toHaveBeenCalled();
  });

  it("addItemForSession rejects invalid quantity", async () => {
    const { addItemForSession } = await import("@/services/cart.service");
    const result = await addItemForSession(userSession, {
      customised_product_id: variantId,
      quantity: 0,
    });
    expect(result.success).toBe(false);
    expect(createCartItemForSession).not.toHaveBeenCalled();
  });

  it("updateCartItemQuantityForSession delegates to repo", async () => {
    updateCartItemForSession.mockResolvedValue({
      success: true,
      data: { id: cartItemId, quantity: 3 },
    });
    const { updateCartItemQuantityForSession } = await import(
      "@/services/cart.service"
    );
    await expect(
      updateCartItemQuantityForSession(userSession, cartItemId, 3),
    ).resolves.toMatchObject({ success: true });
    expect(updateCartItemForSession).toHaveBeenCalledWith(
      userSession,
      cartItemId,
      { quantity: 3 },
    );
  });

  it("deleteCartItemForSession delegates to repo", async () => {
    hardDeleteCartItemForSession.mockResolvedValue({ success: true });
    const { deleteCartItemForSession } = await import(
      "@/services/cart.service"
    );
    await expect(
      deleteCartItemForSession(userSession, cartItemId),
    ).resolves.toEqual({ success: true });
    expect(hardDeleteCartItemForSession).toHaveBeenCalledWith(
      userSession,
      cartItemId,
    );
  });

  it("deleteCartItemService delegates to repo", async () => {
    hardDeleteCartItem.mockResolvedValue({ success: true });
    const { deleteCartItemService } = await import("@/services/cart.service");
    await expect(deleteCartItemService(cartItemId)).resolves.toEqual({
      success: true,
    });
  });

  it("admin cart list returns [] for non-admin", async () => {
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const { getAllCartsForAdminService } = await import(
      "@/services/cart.service"
    );
    await expect(getAllCartsForAdminService()).resolves.toEqual([]);
    expect(getAllCartsForAdmin).not.toHaveBeenCalled();
  });

  it("getCartWithItemsForAdminService loads cart + items for admin", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    getCartByIdForAdmin.mockResolvedValue({
      success: true,
      data: { id: cartId },
    });
    getCartItemsWithProductsByCartIdForAdmin.mockResolvedValue([
      { id: cartItemId },
    ]);
    const { getCartWithItemsForAdminService } = await import(
      "@/services/cart.service"
    );
    await expect(getCartWithItemsForAdminService(cartId)).resolves.toEqual({
      success: true,
      data: {
        cart: { id: cartId },
        items: [{ id: cartItemId }],
      },
    });
  });
});
