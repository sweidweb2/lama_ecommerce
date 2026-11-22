import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionContext } from "@/lib/auth/session-context";

const hasActiveCartBySessionId = vi.fn();
const createCart = vi.fn();
const createCartItem = vi.fn();
const createCartItemAsAdmin = vi.fn();
const incrementProductAddToCartService = vi.fn();

vi.mock("@/repositories/cart.repository", () => ({
  createCart: (...args: unknown[]) => createCart(...args),
  createCartForAdmin: vi.fn(),
  hasActiveCart: vi.fn(),
  hasActiveCartBySessionId: (...args: unknown[]) =>
    hasActiveCartBySessionId(...args),
  // Unified SessionContext helper: routes to the same spy as the legacy alias.
  hasActiveCartForSession: (session: SessionContext) =>
    session.kind === "user"
      ? vi.fn()(session.userId)
      : hasActiveCartBySessionId(session.sessionId),
  getCartForSession: vi.fn(),
  getCartByUserId: vi.fn(),
  getCartBySessionId: vi.fn(),
  getAllCartsForAdmin: vi.fn(),
  getCartByIdForAdmin: vi.fn(),
  deleteCart: vi.fn(),
  hardDeleteCart: vi.fn(),
  updateCartUserId: vi.fn(),
  deleteCartAdmin: vi.fn(),
}));

vi.mock("@/repositories/cart_item.repository", () => ({
  createCartItem: (...args: unknown[]) => createCartItem(...args),
  createCartItemAsAdmin: (...args: unknown[]) => createCartItemAsAdmin(...args),
  createCartItemForSession: (session: SessionContext, input: unknown) =>
    session.kind === "user" ? createCartItem(input) : createCartItemAsAdmin(input),
  updateCartItemForSession: vi.fn(),
  hardDeleteCartItemForSession: vi.fn(),
  getCartItemsWithProductsByCartId: vi.fn(),
  getCartItemsWithProductsByCartIdForAdmin: vi.fn(),
  hardDeleteCartItem: vi.fn(),
  hardDeleteCartItemForGuest: vi.fn(),
  hardDeleteCartItemsByCartId: vi.fn(),
  updateCartItem: vi.fn(),
  updateCartItemForAdmin: vi.fn(),
  updateCartItemForGuest: vi.fn(),
  moveCartItemsToCart: vi.fn(),
}));

vi.mock("@/services/product_view.service", () => ({
  incrementProductAddToCartService: (...args: unknown[]) =>
    incrementProductAddToCartService(...args),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: vi.fn(),
}));

describe("addItemToGuestCartService concurrent create", () => {
  const sessionId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const variantId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
  const winnerCart = {
    id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    user_id: null,
    session_id: sessionId,
    created_at: "2026-07-19T00:00:00Z",
    updated_at: "2026-07-19T00:00:00Z",
  };
  const cartItem = {
    id: "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
    cart_id: winnerCart.id,
    customised_product_id: variantId,
    quantity: 1,
    created_at: "2026-07-19T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    incrementProductAddToCartService.mockResolvedValue(undefined);
  });

  it("retries lookup on 23505 and continues ATC on the winning cart", async () => {
    hasActiveCartBySessionId
      .mockResolvedValueOnce({
        success: true,
        hasActiveCart: false,
      })
      .mockResolvedValueOnce({
        success: true,
        hasActiveCart: true,
        data: winnerCart,
      });

    createCart.mockResolvedValue({
      success: false,
      error: "duplicate key value violates unique constraint",
      code: "23505",
    });

    createCartItemAsAdmin.mockResolvedValue({
      success: true,
      data: cartItem,
    });

    const { addItemToGuestCartService } = await import(
      "@/services/cart.service"
    );

    const result = await addItemToGuestCartService(sessionId, {
      customised_product_id: variantId,
      quantity: 1,
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          cart: winnerCart,
          cartItem,
        }),
      }),
    );
    expect(hasActiveCartBySessionId).toHaveBeenCalledTimes(2);
    expect(createCartItemAsAdmin).toHaveBeenCalledWith({
      cart_id: winnerCart.id,
      customised_product_id: variantId,
      quantity: 1,
    });
  });

  it("returns error when 23505 retry still finds no cart", async () => {
    hasActiveCartBySessionId
      .mockResolvedValueOnce({
        success: true,
        hasActiveCart: false,
      })
      .mockResolvedValueOnce({
        success: true,
        hasActiveCart: false,
      });

    createCart.mockResolvedValue({
      success: false,
      error: "duplicate key",
      code: "23505",
    });

    const { addItemToGuestCartService } = await import(
      "@/services/cart.service"
    );

    const result = await addItemToGuestCartService(sessionId, {
      customised_product_id: variantId,
      quantity: 1,
    });

    expect(result.success).toBe(false);
    expect(createCartItemAsAdmin).not.toHaveBeenCalled();
  });
});
