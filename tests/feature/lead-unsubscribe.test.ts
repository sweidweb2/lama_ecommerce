import { beforeEach, describe, expect, it, vi } from "vitest";

const checkFormRateLimit = vi.fn();
const getClientIpFromHeaders = vi.fn();
const getCurrentAuthUserFromAction = vi.fn();
const createLeadService = vi.fn();
const unsubscribeLeadByTokenService = vi.fn();

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    checkFormRateLimit: (...args: unknown[]) => checkFormRateLimit(...args),
    getClientIpFromHeaders: (...args: unknown[]) =>
      getClientIpFromHeaders(...args),
  };
});

vi.mock("@/repositories/auth.repository", () => ({
  getCurrentAuthUserFromAction: (...args: unknown[]) =>
    getCurrentAuthUserFromAction(...args),
}));

vi.mock("@/services/lead.service", () => ({
  createLeadService: (...args: unknown[]) => createLeadService(...args),
  createLeadAdminService: vi.fn(),
  listLeadsService: vi.fn(),
  exportLeadsService: vi.fn(),
  updateLeadService: vi.fn(),
  deleteLeadService: vi.fn(),
  unsubscribeLeadByTokenService: (...args: unknown[]) =>
    unsubscribeLeadByTokenService(...args),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("createLeadAction outcomes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getClientIpFromHeaders.mockResolvedValue("1.2.3.4");
    checkFormRateLimit.mockResolvedValue(true);
    getCurrentAuthUserFromAction.mockResolvedValue(null);
  });

  it("returns resubscribed outcome", async () => {
    createLeadService.mockResolvedValue("resubscribed");
    const { createLeadAction } = await import("@/actions/lead");
    const fd = new FormData();
    fd.set("email", "back@example.com");
    const result = await createLeadAction(fd);
    expect(result).toEqual({
      success: true,
      outcome: "resubscribed",
    });
  });
});

describe("unsubscribeLeadAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects missing token", async () => {
    const { unsubscribeLeadAction } = await import("@/actions/lead");
    const result = await unsubscribeLeadAction("");
    expect(result.success).toBe(false);
    expect(unsubscribeLeadByTokenService).not.toHaveBeenCalled();
  });

  it("rejects invalid token format", async () => {
    const { unsubscribeLeadAction } = await import("@/actions/lead");
    const result = await unsubscribeLeadAction("not-a-uuid");
    expect(result.success).toBe(false);
    expect(unsubscribeLeadByTokenService).not.toHaveBeenCalled();
  });

  it("returns success for valid unsubscribe", async () => {
    unsubscribeLeadByTokenService.mockResolvedValue({
      ok: true,
      alreadyUnsubscribed: false,
    });
    const { unsubscribeLeadAction } = await import("@/actions/lead");
    const result = await unsubscribeLeadAction(
      "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    );
    expect(result).toEqual({
      success: true,
      alreadyUnsubscribed: false,
    });
  });

  it("maps not_found to guest-facing error", async () => {
    unsubscribeLeadByTokenService.mockResolvedValue({
      ok: false,
      error: "not_found",
    });
    const { unsubscribeLeadAction } = await import("@/actions/lead");
    const result = await unsubscribeLeadAction(
      "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/invalid/i);
    }
  });
});
