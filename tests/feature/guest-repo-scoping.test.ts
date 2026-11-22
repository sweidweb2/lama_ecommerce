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
  createSupabaseAdminClient: () => createSupabaseAdminClient(),
}));

describe("guest cart session scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCartChain();
  });

  it("hasActiveCartForSession (guest) filters by session_id and null user_id", async () => {
    const { hasActiveCartForSession } = await import(
      "@/repositories/cart.repository"
    );
    await hasActiveCartForSession({ kind: "guest", sessionId: "guest-session-abc" });

    expect(from).toHaveBeenCalledWith("carts");
    expect(eq).toHaveBeenCalledWith("session_id", "guest-session-abc");
    expect(is).toHaveBeenCalledWith("user_id", null);
  });

  it("getCartForSession (guest) filters by session_id and null user_id", async () => {
    const { getCartForSession } = await import(
      "@/repositories/cart.repository"
    );
    await getCartForSession({ kind: "guest", sessionId: "guest-session-def" });

    expect(from).toHaveBeenCalledWith("carts");
    expect(eq).toHaveBeenCalledWith("session_id", "guest-session-def");
    expect(is).toHaveBeenCalledWith("user_id", null);
  });
});

describe("guest wishlist session scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getWishlistItemsForSession (guest) filters by session_id and null user_id", async () => {
    const isUser = vi.fn().mockResolvedValue({ data: [], error: null });
    const eqSession = vi.fn(() => ({ is: isUser }));
    const selectWish = vi.fn(() => ({ eq: eqSession }));
    const fromWish = vi.fn(() => ({ select: selectWish }));
    createSupabaseAdminClient.mockReturnValue({ from: fromWish });

    const { getWishlistItemsForSession } = await import(
      "@/repositories/wishlist.repository"
    );
    await getWishlistItemsForSession({ kind: "guest", sessionId: "guest-session-xyz" });

    expect(fromWish).toHaveBeenCalledWith("wishlists");
    expect(eqSession).toHaveBeenCalledWith("session_id", "guest-session-xyz");
    expect(isUser).toHaveBeenCalledWith("user_id", null);
  });
});
