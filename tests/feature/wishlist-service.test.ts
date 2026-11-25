import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionContext } from "@/lib/auth/session-context";

const getAdminShopBlockForUserId = vi.fn();
const getVariantWithParentActive = vi.fn();
const addWishlistItemForSession = vi.fn();
const insertWishlistItemForSession = vi.fn();
const removeWishlistItemByVariantForSession = vi.fn();
const isInWishlistForSession = vi.fn();
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
  getWishlistItemsForSession: vi.fn(),
  countWishlistItemsForSession: vi.fn(),
  addWishlistItemForSession: (...args: unknown[]) =>
    addWishlistItemForSession(...args),
  insertWishlistItemForSession: (...args: unknown[]) =>
    insertWishlistItemForSession(...args),
  removeWishlistItemByIdForSession: vi.fn(),
  removeWishlistItemByVariantForSession: (...args: unknown[]) =>
    removeWishlistItemByVariantForSession(...args),
  isInWishlistForSession: (...args: unknown[]) =>
    isInWishlistForSession(...args),
  claimWishlistBySessionId: (...args: unknown[]) =>
    claimWishlistBySessionId(...args),
}));

const userId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const sessionId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
const variantId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

const userSession: SessionContext = { kind: "user", userId };
const guestSession: SessionContext = { kind: "guest", sessionId };

describe("wishlist.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminShopBlockForUserId.mockResolvedValue(null);
    getVariantWithParentActive.mockResolvedValue({
      id: variantId,
      productIsActive: true,
    });
  });

  it("addToWishlistForSession rejects invalid user id", async () => {
    const { addToWishlistForSession } = await import(
      "@/services/wishlist.service"
    );
    await expect(
      addToWishlistForSession({ kind: "user", userId: "not-a-uuid" }, variantId),
    ).resolves.toEqual({
      success: false,
      error: "Invalid user id",
    });
    expect(addWishlistItemForSession).not.toHaveBeenCalled();
  });

  it("addToWishlistForSession rejects inactive parent product", async () => {
    getVariantWithParentActive.mockResolvedValue({
      id: variantId,
      productIsActive: false,
    });
    const { addToWishlistForSession } = await import(
      "@/services/wishlist.service"
    );
    await expect(
      addToWishlistForSession(userSession, variantId),
    ).resolves.toEqual({
      success: false,
      error: "This product is no longer available",
    });
    expect(addWishlistItemForSession).not.toHaveBeenCalled();
  });

  it("addToWishlistForSession user happy path", async () => {
    addWishlistItemForSession.mockResolvedValue({ success: true });
    const { addToWishlistForSession } = await import(
      "@/services/wishlist.service"
    );
    await expect(
      addToWishlistForSession(userSession, variantId),
    ).resolves.toEqual({ success: true });
    expect(addWishlistItemForSession).toHaveBeenCalledWith(
      userSession,
      variantId,
    );
  });

  it("addToWishlistForSession guest happy path", async () => {
    addWishlistItemForSession.mockResolvedValue({ success: true });
    const { addToWishlistForSession } = await import(
      "@/services/wishlist.service"
    );
    await expect(
      addToWishlistForSession(guestSession, variantId),
    ).resolves.toEqual({ success: true });
    expect(addWishlistItemForSession).toHaveBeenCalledWith(
      guestSession,
      variantId,
    );
  });

  it("toggleWishlistForSession removes when already present", async () => {
    isInWishlistForSession.mockResolvedValue(true);
    removeWishlistItemByVariantForSession.mockResolvedValue({ success: true });
    const { toggleWishlistForSession } = await import(
      "@/services/wishlist.service"
    );
    await expect(
      toggleWishlistForSession(userSession, variantId),
    ).resolves.toEqual({ success: true });
    expect(removeWishlistItemByVariantForSession).toHaveBeenCalledWith(
      userSession,
      variantId,
    );
    expect(addWishlistItemForSession).not.toHaveBeenCalled();
  });

  it("toggleWishlistForSession adds when missing", async () => {
    isInWishlistForSession.mockResolvedValue(false);
    insertWishlistItemForSession.mockResolvedValue({ success: true });
    const { toggleWishlistForSession } = await import(
      "@/services/wishlist.service"
    );
    await expect(
      toggleWishlistForSession(guestSession, variantId),
    ).resolves.toEqual({ success: true });
    expect(insertWishlistItemForSession).toHaveBeenCalledWith(
      guestSession,
      variantId,
    );
    expect(addWishlistItemForSession).not.toHaveBeenCalled();
    expect(removeWishlistItemByVariantForSession).not.toHaveBeenCalled();
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
