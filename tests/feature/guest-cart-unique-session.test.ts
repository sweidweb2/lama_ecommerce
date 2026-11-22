import { beforeEach, describe, expect, it, vi } from "vitest";

const hasActiveCartForSession = vi.fn();
const createCart = vi.fn();
const createCartItemForSession = vi.fn();
const incrementProductAddToCartService = vi.fn();

vi.mock("@/repositories/cart.repository", () => ({
  createCart: (...args: unknown[]) => createCart(...args),
  createCartForAdmin: vi.fn(),
  hasActiveCartForSession: (...args: unknown[]) =>
    hasActiveCartForSession(...args),
  getCartForSession: vi.fn(),
  getAllCartsForAdmin: vi.fn(),
  getCartByIdForAdmin: vi.fn(),
  deleteCart: vi.fn(),
  hardDeleteCart: vi.fn(),
  mergeGuestCartToUser: vi.fn(),
}));

vi.mock("@/repositories/cart_item.repository", () => ({
  createCartItemAsAdmin: vi.fn(),
  createCartItemForSession: (...args: unknown[]) =>
    createCartItemForSession(...args),
  updateCartItemForSession: vi.fn(),
  hardDeleteCartItemForSession: vi.fn(),
  getCartItemsWithProductsByCartId: vi.fn(),
  getCartItemsWithProductsByCartIdForAdmin: vi.fn(),
  hardDeleteCartItem: vi.fn(),
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

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: vi.fn(),
}));

describe("addItemForSession (guest) concurrent create", () => {
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
    hasActiveCartForSession
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

    createCartItemForSession.mockResolvedValue({
      success: true,
      data: cartItem,
    });

    const { addItemForSession } = await import(
      "@/services/cart.service"
    );

    const result = await addItemForSession({ kind: "guest", sessionId }, {
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
    expect(hasActiveCartForSession).toHaveBeenCalledTimes(2);
    expect(createCartItemForSession).toHaveBeenCalledWith(
      { kind: "guest", sessionId },
      {
        cart_id: winnerCart.id,
        customised_product_id: variantId,
        quantity: 1,
      },
    );
  });

  it("returns error when 23505 retry still finds no cart", async () => {
    hasActiveCartForSession
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

    const { addItemForSession } = await import(
      "@/services/cart.service"
    );

    const result = await addItemForSession({ kind: "guest", sessionId }, {
      customised_product_id: variantId,
      quantity: 1,
    });

    expect(result.success).toBe(false);
    expect(createCartItemForSession).not.toHaveBeenCalled();
  });
});
