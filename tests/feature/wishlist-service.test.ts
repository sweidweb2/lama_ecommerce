import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionContext } from "@/lib/auth/session-context";

const getAdminShopBlockForUserId = vi.fn();
const getVariantWithParentActive = vi.fn();
const addWishlistItem = vi.fn();
const addWishlistItemForGuest = vi.fn();
const isInWishlist = vi.fn();
const removeWishlistItemByVariant = vi.fn();
const removeWishlistItemByVariantForGuest = vi.fn();
const isInWishlistForGuest = vi.fn();
const claimWishlistBySessionId = vi.fn();

vi.mock("@/services/profile.service", () => ({
  getAdminShopBlockForUserId: (...args: unknown[]) =>
    getAdminShopBlockForUserId(...args),
}));

vi.mock("@/repositories/product_variant.repository", () => ({
  getVariantWithParentActive: (...args: unknown[]) =>
    getVariantWithParentActive(...args),
}));

vi.mock("@/repositories/wishlist.repository", () => ({
  getWishlistItemsByUserId: vi.fn(),
  getWishlistItemsBySessionId: vi.fn(),
  countWishlistItemsByUserId: vi.fn(),
  countWishlistItemsBySessionId: vi.fn(),
  addWishlistItem: (...args: unknown[]) => addWishlistItem(...args),
  addWishlistItemForGuest: (...args: unknown[]) =>
    addWishlistItemForGuest(...args),
  removeWishlistItemById: vi.fn(),
  removeWishlistItemByIdForGuest: vi.fn(),
  removeWishlistItemByVariant: (...args: unknown[]) =>
    removeWishlistItemByVariant(...args),
  removeWishlistItemByVariantForGuest: (...args: unknown[]) =>
    removeWishlistItemByVariantForGuest(...args),
  isInWishlist: (...args: unknown[]) => isInWishlist(...args),
  isInWishlistForGuest: (...args: unknown[]) => isInWishlistForGuest(...args),
  claimWishlistBySessionId: (...args: unknown[]) =>
    claimWishlistBySessionId(...args),
  // Unified SessionContext helpers: route to the same spies as the legacy aliases.
  getWishlistItemsForSession: vi.fn(),
  countWishlistItemsForSession: vi.fn(),
  addWishlistItemForSession: (session: SessionContext, variantId: string) =>
    session.kind === "user"
      ? addWishlistItem(session.userId, variantId)
      : addWishlistItemForGuest(session.sessionId, variantId),
  removeWishlistItemByIdForSession: vi.fn(),
  removeWishlistItemByVariantForSession: (
    session: SessionContext,
    variantId: string,
  ) =>
    session.kind === "user"
      ? removeWishlistItemByVariant(session.userId, variantId)
      : removeWishlistItemByVariantForGuest(session.sessionId, variantId),
  isInWishlistForSession: (session: SessionContext, variantId: string) =>
    session.kind === "user"
      ? isInWishlist(session.userId, variantId)
      : isInWishlistForGuest(session.sessionId, variantId),
}));

const userId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const sessionId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
const variantId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

describe("wishlist.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminShopBlockForUserId.mockResolvedValue(null);
    getVariantWithParentActive.mockResolvedValue({
      id: variantId,
      productIsActive: true,
    });
  });

  it("addToWishlist rejects invalid uuid", async () => {
    const { addToWishlist } = await import("@/services/wishlist.service");
    await expect(addToWishlist("not-a-uuid", variantId)).resolves.toEqual({
      success: false,
      error: "Invalid user id",
    });
  });

  it("addToWishlist rejects inactive parent product", async () => {
    getVariantWithParentActive.mockResolvedValue({
      id: variantId,
      productIsActive: false,
    });
    const { addToWishlist } = await import("@/services/wishlist.service");
    await expect(addToWishlist(userId, variantId)).resolves.toEqual({
      success: false,
      error: "This product is no longer available",
    });
    expect(addWishlistItem).not.toHaveBeenCalled();
  });

  it("addToWishlist happy path", async () => {
    addWishlistItem.mockResolvedValue({ success: true });
    const { addToWishlist } = await import("@/services/wishlist.service");
    await expect(addToWishlist(userId, variantId)).resolves.toEqual({
      success: true,
    });
    expect(addWishlistItem).toHaveBeenCalledWith(userId, variantId);
  });

  it("addToWishlistForGuest happy path", async () => {
    addWishlistItemForGuest.mockResolvedValue({ success: true });
    const { addToWishlistForGuest } = await import(
      "@/services/wishlist.service"
    );
    await expect(addToWishlistForGuest(sessionId, variantId)).resolves.toEqual({
      success: true,
    });
  });

  it("toggleWishlistForUser removes when already present", async () => {
    isInWishlist.mockResolvedValue(true);
    removeWishlistItemByVariant.mockResolvedValue({ success: true });
    const { toggleWishlistForUser } = await import(
      "@/services/wishlist.service"
    );
    await expect(toggleWishlistForUser(userId, variantId)).resolves.toEqual({
      success: true,
    });
    expect(removeWishlistItemByVariant).toHaveBeenCalled();
    expect(addWishlistItem).not.toHaveBeenCalled();
  });

  it("toggleWishlistForUser adds when missing", async () => {
    isInWishlist.mockResolvedValue(false);
    addWishlistItem.mockResolvedValue({ success: true });
    const { toggleWishlistForUser } = await import(
      "@/services/wishlist.service"
    );
    await expect(toggleWishlistForUser(userId, variantId)).resolves.toEqual({
      success: true,
    });
    expect(addWishlistItem).toHaveBeenCalled();
  });

  it("claimGuestWishlistService validates ids and claims", async () => {
    claimWishlistBySessionId.mockResolvedValue({
      success: true,
      claimedCount: 2,
    });
    const { claimGuestWishlistService } = await import(
      "@/services/wishlist.service"
    );
    await expect(
      claimGuestWishlistService(userId, sessionId),
    ).resolves.toEqual({ success: true, claimedCount: 2 });
  });
});
