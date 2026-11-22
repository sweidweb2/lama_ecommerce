import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_CANNOT_SHOP_MESSAGE } from "@/lib/auth/permissions";

const getCurrentAuthUserFromAction = vi.fn();
const getGuestSessionId = vi.fn();
const clearGuestSessionCookie = vi.fn();
const claimGuestOrdersService = vi.fn();
const mergeGuestCartToUserService = vi.fn();
const claimGuestWishlistService = vi.fn();
const getAdminShopBlockForUserId = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/repositories/auth.repository", () => ({
  getCurrentAuthUserFromAction: (...args: unknown[]) =>
    getCurrentAuthUserFromAction(...args),
}));

vi.mock("@/lib/auth/guest-session", () => ({
  getGuestSessionId: (...args: unknown[]) => getGuestSessionId(...args),
  clearGuestSessionCookie: (...args: unknown[]) =>
    clearGuestSessionCookie(...args),
  getOrCreateGuestSessionId: vi.fn(),
}));

vi.mock("@/services/order.service", () => ({
  claimGuestOrdersService: (...args: unknown[]) =>
    claimGuestOrdersService(...args),
}));

vi.mock("@/services/wishlist.service", () => ({
  claimGuestWishlistService: (...args: unknown[]) =>
    claimGuestWishlistService(...args),
}));

vi.mock("@/services/cart.service", () => ({
  mergeGuestCartToUserService: (...args: unknown[]) =>
    mergeGuestCartToUserService(...args),
  addItemForSession: vi.fn(),
  addItemToCartByIdService: vi.fn(),
  getUserCartService: vi.fn(),
  getCartWithItemsForSession: vi.fn(),
  deleteCartItemForSession: vi.fn(),
  updateCartItemQuantityForSession: vi.fn(),
  deleteCartService: vi.fn(),
  hardDeleteCartService: vi.fn(),
  updateCartItemService: vi.fn(),
  deleteCartItemForAdminService: vi.fn(),
  createCartForAdminService: vi.fn(),
  getCartWithItemsForAdminService: vi.fn(),
}));

vi.mock("@/services/profile.service", () => ({
  getAdminShopBlockForUserId: (...args: unknown[]) =>
    getAdminShopBlockForUserId(...args),
  getCurrentUserProfile: vi.fn(),
}));

vi.mock("@/lib/auth/require-customer-shop", () => ({
  getAdminShopBlockForCurrentUser: vi.fn().mockResolvedValue(null),
  getAdminShopBlockForUserId: (...args: unknown[]) =>
    getAdminShopBlockForUserId(...args),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

describe("mergeGuestCartOnLoginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentAuthUserFromAction.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
    getGuestSessionId.mockResolvedValue("sess-1");
    getAdminShopBlockForUserId.mockResolvedValue(null);
    claimGuestOrdersService.mockResolvedValue({
      success: true,
      claimedCount: 1,
    });
    mergeGuestCartToUserService.mockResolvedValue({
      success: true,
      merged: true,
    });
    claimGuestWishlistService.mockResolvedValue({
      success: true,
      claimedCount: 1,
    });
  });

  it("claims orders, merges cart, claims wishlist, and clears cookie on full success", async () => {
    const callOrder: string[] = [];
    claimGuestOrdersService.mockImplementation(async () => {
      callOrder.push("claim");
      return { success: true, claimedCount: 1 };
    });
    mergeGuestCartToUserService.mockImplementation(async () => {
      callOrder.push("merge");
      return { success: true, merged: true };
    });
    claimGuestWishlistService.mockImplementation(async () => {
      callOrder.push("wishlist");
      return { success: true, claimedCount: 1 };
    });

    const { mergeGuestCartOnLoginAction } = await import("@/actions/cart");
    const result = await mergeGuestCartOnLoginAction();

    expect(result).toEqual({
      success: true,
      merged: true,
      clearedGuestCookie: true,
      ordersClaimed: true,
      cartMerged: true,
      wishlistClaimed: true,
    });
    expect(callOrder).toEqual(["claim", "merge", "wishlist"]);
    expect(claimGuestOrdersService).toHaveBeenCalledWith(
      "user-1",
      "sess-1",
      "user@example.com",
    );
    expect(mergeGuestCartToUserService).toHaveBeenCalledWith(
      "user-1",
      "sess-1",
    );
    expect(claimGuestWishlistService).toHaveBeenCalledWith("user-1", "sess-1");
    expect(clearGuestSessionCookie).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/cart");
    expect(revalidatePath).toHaveBeenCalledWith("/orders");
    expect(revalidatePath).toHaveBeenCalledWith("/order_details");
    expect(revalidatePath).toHaveBeenCalledWith("/wishlist");
  });

  it("skips claim/merge for admin and clears guest cookie only", async () => {
    getAdminShopBlockForUserId.mockResolvedValue(ADMIN_CANNOT_SHOP_MESSAGE);

    const { mergeGuestCartOnLoginAction } = await import("@/actions/cart");
    const result = await mergeGuestCartOnLoginAction();

    expect(result).toEqual({
      success: true,
      merged: false,
      clearedGuestCookie: true,
      skippedAsAdmin: true,
    });
    expect(claimGuestOrdersService).not.toHaveBeenCalled();
    expect(mergeGuestCartToUserService).not.toHaveBeenCalled();
    expect(claimGuestWishlistService).not.toHaveBeenCalled();
    expect(clearGuestSessionCookie).toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does not merge or clear cookie when claim fails", async () => {
    claimGuestOrdersService.mockResolvedValue({
      success: false,
      error: "claim failed",
      claimedCount: 0,
    });

    const { mergeGuestCartOnLoginAction } = await import("@/actions/cart");
    const result = await mergeGuestCartOnLoginAction();

    expect(result).toEqual({
      success: false,
      error: "claim failed",
      merged: false,
      clearedGuestCookie: false,
      ordersClaimed: false,
      failedStep: "orders",
    });
    expect(mergeGuestCartToUserService).not.toHaveBeenCalled();
    expect(claimGuestWishlistService).not.toHaveBeenCalled();
    expect(clearGuestSessionCookie).not.toHaveBeenCalled();
  });

  it("does not clear cookie when merge fails after successful claim", async () => {
    mergeGuestCartToUserService.mockResolvedValue({
      success: false,
      error: "merge failed",
      merged: false,
    });

    const { mergeGuestCartOnLoginAction } = await import("@/actions/cart");
    const result = await mergeGuestCartOnLoginAction();

    expect(result).toEqual({
      success: false,
      error: "merge failed",
      merged: false,
      clearedGuestCookie: false,
      ordersClaimed: true,
      cartMerged: false,
      failedStep: "cart",
    });
    expect(claimGuestOrdersService).toHaveBeenCalled();
    expect(claimGuestWishlistService).not.toHaveBeenCalled();
    expect(clearGuestSessionCookie).not.toHaveBeenCalled();
  });

  it("does not clear cookie when wishlist claim fails after merge", async () => {
    claimGuestWishlistService.mockResolvedValue({
      success: false,
      error: "wishlist failed",
      claimedCount: 0,
    });

    const { mergeGuestCartOnLoginAction } = await import("@/actions/cart");
    const result = await mergeGuestCartOnLoginAction();

    expect(result).toEqual({
      success: false,
      error: "wishlist failed",
      merged: false,
      clearedGuestCookie: false,
      ordersClaimed: true,
      cartMerged: true,
      wishlistClaimed: false,
      failedStep: "wishlist",
    });
    expect(clearGuestSessionCookie).not.toHaveBeenCalled();
  });

  it("returns early when there is no guest session", async () => {
    getGuestSessionId.mockResolvedValue(null);

    const { mergeGuestCartOnLoginAction } = await import("@/actions/cart");
    const result = await mergeGuestCartOnLoginAction();

    expect(result).toEqual({
      success: true,
      merged: false,
      clearedGuestCookie: false,
    });
    expect(claimGuestOrdersService).not.toHaveBeenCalled();
    expect(mergeGuestCartToUserService).not.toHaveBeenCalled();
    expect(claimGuestWishlistService).not.toHaveBeenCalled();
  });
});
