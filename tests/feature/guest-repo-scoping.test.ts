import { beforeEach, describe, expect, it, vi } from "vitest";

const eq = vi.fn();
const is = vi.fn();
const select = vi.fn();
const from = vi.fn();
const order = vi.fn();
const limit = vi.fn();
const maybeSingle = vi.fn();

function resetCartChain() {
  maybeSingle.mockResolvedValue({ data: null, error: null });
  limit.mockReturnValue({ maybeSingle });
  order.mockReturnValue({ limit });
  is.mockImplementation(() => ({ is, order, eq, limit, maybeSingle }));
  eq.mockImplementation(() => ({ is, eq, order, limit, maybeSingle }));
  select.mockReturnValue({ eq, is, order, limit, maybeSingle });
  from.mockReturnValue({ select });
}

const createSupabaseAdminClient = vi.fn(() => ({ from }));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: (...args: unknown[]) =>
    createSupabaseAdminClient(...args),
}));

describe("guest cart session scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCartChain();
  });

  it("hasActiveCartBySessionId filters by session_id and null user_id", async () => {
    const { hasActiveCartBySessionId } = await import(
      "@/repositories/cart.repository"
    );
    await hasActiveCartBySessionId("guest-session-abc");

    expect(from).toHaveBeenCalledWith("carts");
    expect(eq).toHaveBeenCalledWith("session_id", "guest-session-abc");
    expect(is).toHaveBeenCalledWith("user_id", null);
    expect(is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("getCartBySessionId filters by session_id and null user_id", async () => {
    const { getCartBySessionId } = await import(
      "@/repositories/cart.repository"
    );
    await getCartBySessionId("guest-session-def");

    expect(from).toHaveBeenCalledWith("carts");
    expect(eq).toHaveBeenCalledWith("session_id", "guest-session-def");
    expect(is).toHaveBeenCalledWith("user_id", null);
    expect(is).toHaveBeenCalledWith("deleted_at", null);
  });
});

describe("guest wishlist session scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getWishlistItemsBySessionId filters by session_id and null user_id", async () => {
    const isDeleted = vi.fn().mockResolvedValue({ data: [], error: null });
    const isUser = vi.fn(() => ({ is: isDeleted }));
    const eqSession = vi.fn(() => ({ is: isUser }));
    const selectWish = vi.fn(() => ({ eq: eqSession }));
    const fromWish = vi.fn(() => ({ select: selectWish }));
    createSupabaseAdminClient.mockReturnValue({ from: fromWish });

    const { getWishlistItemsBySessionId } = await import(
      "@/repositories/wishlist.repository"
    );
    await getWishlistItemsBySessionId("guest-session-xyz");

    expect(fromWish).toHaveBeenCalledWith("wishlists");
    expect(eqSession).toHaveBeenCalledWith("session_id", "guest-session-xyz");
    expect(isUser).toHaveBeenCalledWith("user_id", null);
    expect(isDeleted).toHaveBeenCalledWith("deleted_at", null);
  });
});
