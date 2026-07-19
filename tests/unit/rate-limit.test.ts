import { beforeEach, describe, expect, it, vi } from "vitest";

const checkFormRateLimitRpc = vi.fn();

vi.mock("@/repositories/form_rate_limit.repository", () => ({
  checkFormRateLimitRpc: (...args: unknown[]) => checkFormRateLimitRpc(...args),
}));

describe("checkFormRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows when RPC returns allowed true", async () => {
    checkFormRateLimitRpc.mockResolvedValue({ success: true, allowed: true });

    const { checkFormRateLimit } = await import("@/lib/rate-limit");
    const allowed = await checkFormRateLimit({
      key: "contact:1.1.1.1",
      limit: 5,
      windowSeconds: 900,
    });

    expect(allowed).toBe(true);
    expect(checkFormRateLimitRpc).toHaveBeenCalledWith({
      key: "contact:1.1.1.1",
      limit: 5,
      windowSeconds: 900,
    });
  });

  it("denies when RPC returns allowed false", async () => {
    checkFormRateLimitRpc.mockResolvedValue({ success: true, allowed: false });

    const { checkFormRateLimit } = await import("@/lib/rate-limit");
    const allowed = await checkFormRateLimit({
      key: "contact:1.1.1.1",
      limit: 5,
      windowSeconds: 900,
    });

    expect(allowed).toBe(false);
  });

  it("fails closed when RPC returns success false", async () => {
    checkFormRateLimitRpc.mockResolvedValue({
      success: false,
      allowed: false,
      error: "relation missing",
    });

    const { checkFormRateLimit } = await import("@/lib/rate-limit");
    const allowed = await checkFormRateLimit({
      key: "contact:1.1.1.1",
      limit: 5,
      windowSeconds: 900,
    });

    expect(allowed).toBe(false);
  });
});
