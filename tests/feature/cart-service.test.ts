import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile } from "../helpers/mocks";
import type { SessionContext } from "@/lib/auth/session-context";

const requireAdmin = vi.fn();
const getAdminShopBlockForUserId = vi.fn();
const hasActiveCart = vi.fn();
const hasActiveCartBySessionId = vi.fn();
const createCart = vi.fn();
const createCartItem = vi.fn();
const createCartItemAsAdmin = vi.fn();
const updateCartItem = vi.fn();
const updateCartItemForGuest = vi.fn();
const hardDeleteCartItem = vi.fn();
const hardDeleteCartItemForGuest = vi.fn();
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
  hasActiveCart: (...args: unknown[]) => hasActiveCart(...args),
  hasActiveCartBySessionId: (...args: unknown[]) =>
    hasActiveCartBySessionId(...args),
  // Unified SessionContext helpers: route to the same spies as the legacy aliases.
  hasActiveCartForSession: (session: SessionContext) =>
    session.kind === "user"
      ? hasActiveCart(session.userId)
      : hasActiveCartBySessionId(session.sessionId),
  getCartForSession: vi.fn(),
  getCartByUserId: vi.fn(),
  getCartBySessionId: vi.fn(),
  getAllCartsForAdmin: (...args: unknown[]) => getAllCartsForAdmin(...args),
  getCartByIdForAdmin: (...args: unknown[]) => getCartByIdForAdmin(...args),
  deleteCart: vi.fn(),
  hardDeleteCart: vi.fn(),
  updateCartUserId: vi.fn(),
  deleteCartAdmin: vi.fn(),
  getUserIdsWithActiveCarts: vi.fn(),
}));

vi.mock("@/repositories/cart_item.repository", () => ({
  createCartItem: (...args: unknown[]) => createCartItem(...args),
  createCartItemAsAdmin: (...args: unknown[]) => createCartItemAsAdmin(...args),
  createCartItemForSession: (session: SessionContext, input: unknown) =>
    session.kind === "user" ? createCartItem(input) : createCartItemAsAdmin(input),
  updateCartItemForSession: (
    session: SessionContext,
    itemId: string,
    input: unknown,
  ) =>
    session.kind === "user"
      ? updateCartItem(itemId, input)
      : updateCartItemForGuest(session.sessionId, itemId, input),
  hardDeleteCartItemForSession: (session: SessionContext, itemId: string) =>
    session.kind === "user"
      ? hardDeleteCartItem(itemId)
      : hardDeleteCartItemForGuest(session.sessionId, itemId),
  getCartItemsWithProductsByCartId: vi.fn(),
  getCartItemsWithProductsByCartIdForAdmin: (...args: unknown[]) =>
    getCartItemsWithProductsByCartIdForAdmin(...args),
  hardDeleteCartItem: (...args: unknown[]) => hardDeleteCartItem(...args),
  hardDeleteCartItemForGuest: (...args: unknown[]) =>
    hardDeleteCartItemForGuest(...args),
  hardDeleteCartItemForAdmin: vi.fn(),
  hardDeleteCartItemsByCartId: vi.fn(),
  updateCartItem: (...args: unknown[]) => updateCartItem(...args),
  updateCartItemForAdmin: vi.fn(),
  updateCartItemForGuest: (...args: unknown[]) =>
    updateCartItemForGuest(...args),
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

describe("cart.service happy paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminShopBlockForUserId.mockResolvedValue(null);
    incrementProductAddToCartService.mockResolvedValue({ success: true });
  });

  it("addItemToCartService creates cart then adds item", async () => {
    hasActiveCart.mockResolvedValue({ success: true, hasActiveCart: false });
    createCart.mockResolvedValue({
      success: true,
      data: { id: cartId, user_id: userId },
    });
    createCartItem.mockResolvedValue({
      success: true,
      data: {
        id: cartItemId,
        cart_id: cartId,
        customised_product_id: variantId,
        quantity: 2,
      },
    });

    const { addItemToCartService } = await import("@/services/cart.service");
    const result = await addItemToCartService(userId, {
      customised_product_id: variantId,
      quantity: 2,
    });

    expect(result.success).toBe(true);
    expect(createCart).toHaveBeenCalledWith(userId, {});
    expect(createCartItem).toHaveBeenCalledWith({
      cart_id: cartId,
      customised_product_id: variantId,
      quantity: 2,
    });
  });

  it("addItemToCartService reuses existing active cart", async () => {
    hasActiveCart.mockResolvedValue({
      success: true,
      hasActiveCart: true,
      data: { id: cartId, user_id: userId },
    });
    createCartItem.mockResolvedValue({
      success: true,
      data: { id: cartItemId, cart_id: cartId, quantity: 1 },
    });

    const { addItemToCartService } = await import("@/services/cart.service");
    const result = await addItemToCartService(userId, {
      customised_product_id: variantId,
      quantity: 1,
    });

    expect(result.success).toBe(true);
    expect(createCart).not.toHaveBeenCalled();
  });

  it("addItemToCartService rejects invalid quantity", async () => {
    const { addItemToCartService } = await import("@/services/cart.service");
    const result = await addItemToCartService(userId, {
      customised_product_id: variantId,
      quantity: 0,
    });
    expect(result.success).toBe(false);
    expect(createCartItem).not.toHaveBeenCalled();
  });

  it("updateUserCartItemQuantityService delegates to repo", async () => {
    updateCartItem.mockResolvedValue({
      success: true,
      data: { id: cartItemId, quantity: 3 },
    });
    const { updateUserCartItemQuantityService } = await import(
      "@/services/cart.service"
    );
    await expect(
      updateUserCartItemQuantityService(cartItemId, 3),
    ).resolves.toMatchObject({ success: true });
    expect(updateCartItem).toHaveBeenCalledWith(cartItemId, { quantity: 3 });
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
