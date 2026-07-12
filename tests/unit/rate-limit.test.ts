import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFormRateLimitClientMock } from "../helpers/mocks";

const createSupabaseAdminClient = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: (...args: unknown[]) =>
    createSupabaseAdminClient(...args),
}));

describe("checkFormRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows when no existing row and upserts hit_count 1", async () => {
    const client = createFormRateLimitClientMock({ row: null });
    createSupabaseAdminClient.mockReturnValue(client);

    const { checkFormRateLimit } = await import("@/lib/rate-limit");
    const allowed = await checkFormRateLimit({
      key: "contact:1.1.1.1",
      limit: 5,
      windowSeconds: 900,
    });

    expect(allowed).toBe(true);
    expect(client.upsert).toHaveBeenCalled();
  });

  it("allows when window expired and resets counter", async () => {
    const expired = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const client = createFormRateLimitClientMock({
      row: {
        key: "contact:1.1.1.1",
        window_started_at: expired,
        hit_count: 5,
      },
    });
    createSupabaseAdminClient.mockReturnValue(client);

    const { checkFormRateLimit } = await import("@/lib/rate-limit");
    const allowed = await checkFormRateLimit({
      key: "contact:1.1.1.1",
      limit: 5,
      windowSeconds: 900,
    });

    expect(allowed).toBe(true);
    expect(client.upsert).toHaveBeenCalled();
  });

  it("denies when hit_count is at limit inside window", async () => {
    const recent = new Date(Date.now() - 60 * 1000).toISOString();
    const client = createFormRateLimitClientMock({
      row: {
        key: "contact:1.1.1.1",
        window_started_at: recent,
        hit_count: 5,
      },
    });
    createSupabaseAdminClient.mockReturnValue(client);

    const { checkFormRateLimit } = await import("@/lib/rate-limit");
    const allowed = await checkFormRateLimit({
      key: "contact:1.1.1.1",
      limit: 5,
      windowSeconds: 900,
    });

    expect(allowed).toBe(false);
    expect(client.update).not.toHaveBeenCalled();
  });

  it("increments when under limit inside window", async () => {
    const recent = new Date(Date.now() - 60 * 1000).toISOString();
    const client = createFormRateLimitClientMock({
      row: {
        key: "contact:1.1.1.1",
        window_started_at: recent,
        hit_count: 2,
      },
    });
    createSupabaseAdminClient.mockReturnValue(client);

    const { checkFormRateLimit } = await import("@/lib/rate-limit");
    const allowed = await checkFormRateLimit({
      key: "contact:1.1.1.1",
      limit: 5,
      windowSeconds: 900,
    });

    expect(allowed).toBe(true);
    expect(client.update).toHaveBeenCalledWith({ hit_count: 3 });
  });

  it("fails open when select returns an error", async () => {
    const client = createFormRateLimitClientMock({
      selectError: { message: "relation missing" },
    });
    createSupabaseAdminClient.mockReturnValue(client);

    const { checkFormRateLimit } = await import("@/lib/rate-limit");
    const allowed = await checkFormRateLimit({
      key: "contact:1.1.1.1",
      limit: 5,
      windowSeconds: 900,
    });

    expect(allowed).toBe(true);
  });
});
