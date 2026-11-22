import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_CANNOT_SHOP_MESSAGE } from "@/lib/auth/permissions";

const getAdminShopBlockForCurrentUser = vi.fn();
const getCurrentAuthUserFromAction = vi.fn();
const addItemForSession = vi.fn();
const checkoutService = vi.fn();
const toggleWishlistForSession = vi.fn();
const createReviewService = vi.fn();

vi.mock("@/lib/auth/require-customer-shop", () => ({
  getAdminShopBlockForCurrentUser: (...args: unknown[]) =>
    getAdminShopBlockForCurrentUser(...args),
}));

vi.mock("@/repositories/auth.repository", () => ({
  getCurrentAuthUserFromAction: (...args: unknown[]) =>
    getCurrentAuthUserFromAction(...args),
}));

vi.mock("@/lib/auth/guest-session", () => ({
  getGuestSessionId: vi.fn(),
  getOrCreateGuestSessionId: vi.fn(),
  clearGuestSessionCookie: vi.fn(),
}));

vi.mock("@/services/cart.service", () => ({
  addItemForSession: (...args: unknown[]) => addItemForSession(...args),
  addItemToCartByIdService: vi.fn(),
  getUserCartService: vi.fn(),
  getCartWithItemsForSession: vi.fn(),
  mergeGuestCartToUserService: vi.fn(),
  deleteCartItemForSession: vi.fn(),
  updateCartItemQuantityForSession: vi.fn(),
  deleteCartService: vi.fn(),
  hardDeleteCartService: vi.fn(),
  updateCartItemService: vi.fn(),
  deleteCartItemForAdminService: vi.fn(),
  createCartForAdminService: vi.fn(),
  getCartWithItemsForAdminService: vi.fn(),
}));

vi.mock("@/services/checkout.service", () => ({
  checkoutService: (...args: unknown[]) => checkoutService(...args),
}));

vi.mock("@/services/wishlist.service", () => ({
  toggleWishlistForSession: (...args: unknown[]) =>
    toggleWishlistForSession(...args),
  removeFromWishlistForSession: vi.fn(),
  checkIfInWishlistForSession: vi.fn(),
  getWishlistCountForSession: vi.fn(),
  claimGuestWishlistService: vi.fn(),
}));

vi.mock("@/services/review.service", () => ({
  createReviewService: (...args: unknown[]) => createReviewService(...args),
  updateReviewService: vi.fn(),
  deleteReviewService: vi.fn(),
}));

vi.mock("@/services/order.service", () => ({
  claimGuestOrdersService: vi.fn(),
}));

vi.mock("@/services/profile.service", () => ({
  getAdminShopBlockForUserId: vi.fn().mockResolvedValue(null),
  getCurrentUserProfile: vi.fn(),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("admin storefront commerce rejection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminShopBlockForCurrentUser.mockResolvedValue(ADMIN_CANNOT_SHOP_MESSAGE);
    getCurrentAuthUserFromAction.mockResolvedValue({ id: "admin-1" });
  });

  it("rejects addItemToCartAction for admin", async () => {
    const { addItemToCartAction } = await import("@/actions/cart");
    const result = await addItemToCartAction({
      customised_product_id: "00000000-0000-4000-8000-000000000001",
      quantity: 1,
    });

    expect(result).toEqual({
      success: false,
      error: ADMIN_CANNOT_SHOP_MESSAGE,
    });
    expect(addItemForSession).not.toHaveBeenCalled();
  });

  it("rejects checkoutAction for admin", async () => {
    const { checkoutAction } = await import("@/actions/checkout");
    const result = await checkoutAction({
      cart_id: "00000000-0000-4000-8000-000000000010",
      shipping_zone_id: "00000000-0000-4000-8000-000000000011",
      phone: "+1234567890",
      email: "admin@example.com",
      address: {
        country: "US",
        city: "NYC",
        address: "1 Main St",
        postal_code: "10001",
      },
      promo_code: undefined,
    });

    expect(result).toEqual({
      success: false,
      error: ADMIN_CANNOT_SHOP_MESSAGE,
    });
    expect(checkoutService).not.toHaveBeenCalled();
  });

  it("rejects toggleWishlistAction for admin", async () => {
    const { toggleWishlistAction } = await import("@/actions/wishlist");
    const result = await toggleWishlistAction(
      "00000000-0000-4000-8000-000000000002",
    );

    expect(result).toEqual({
      success: false,
      error: ADMIN_CANNOT_SHOP_MESSAGE,
    });
    expect(toggleWishlistForSession).not.toHaveBeenCalled();
  });

  it("rejects createReviewAction for admin", async () => {
    const { createReviewAction } = await import("@/actions/review");
    const result = await createReviewAction({
      product_id: "00000000-0000-4000-8000-000000000003",
      rating: 5,
      comment: "Great product",
    });

    expect(result).toEqual({
      success: false,
      error: ADMIN_CANNOT_SHOP_MESSAGE,
    });
    expect(createReviewService).not.toHaveBeenCalled();
  });
});
