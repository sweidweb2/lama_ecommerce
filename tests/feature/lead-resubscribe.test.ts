import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
const eqSelect = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq: eqSelect }));
const eqUpdate = vi.fn();
const update = vi.fn(() => ({ eq: eqUpdate }));
const insert = vi.fn();
const from = vi.fn(() => ({ select, update, insert }));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ from }),
}));

describe("unsubscribeLeadByToken repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks subscribed lead as unsubscribed", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        id: "lead-1",
        email: "a@b.com",
        user_id: null,
        status: "subscribed",
        source: "footer",
        unsubscribed_at: null,
        unsubscribe_token: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        created_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    });
    eqUpdate.mockResolvedValue({ error: null });

    const { unsubscribeLeadByToken } = await import(
      "@/repositories/lead.repository"
    );
    const result = await unsubscribeLeadByToken(
      "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    );
    expect(result).toEqual({ ok: true, alreadyUnsubscribed: false });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "unsubscribed" }),
    );
  });

  it("is idempotent when already unsubscribed", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        id: "lead-1",
        email: "a@b.com",
        user_id: null,
        status: "unsubscribed",
        source: "footer",
        unsubscribed_at: "2026-01-02T00:00:00Z",
        unsubscribe_token: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        created_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    });

    const { unsubscribeLeadByToken } = await import(
      "@/repositories/lead.repository"
    );
    const result = await unsubscribeLeadByToken(
      "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    );
    expect(result).toEqual({ ok: true, alreadyUnsubscribed: true });
    expect(update).not.toHaveBeenCalled();
  });
});

describe("createLead reactivate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reactivates unsubscribed lead on unique conflict", async () => {
    insert.mockResolvedValue({
      error: { code: "23505", message: "duplicate" },
    });
    maybeSingle.mockResolvedValue({
      data: {
        id: "lead-1",
        email: "a@b.com",
        user_id: null,
        status: "unsubscribed",
        source: "footer",
        unsubscribed_at: "2026-01-02T00:00:00Z",
        unsubscribe_token: "old-token",
        created_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    });
    eqUpdate.mockResolvedValue({ error: null });

    const { createLead } = await import("@/repositories/lead.repository");
    const status = await createLead({ email: "a@b.com" });
    expect(status).toBe("resubscribed");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "subscribed",
        unsubscribed_at: null,
      }),
    );
  });

  it("returns already_subscribed for active duplicate", async () => {
    insert.mockResolvedValue({
      error: { code: "23505", message: "duplicate" },
    });
    maybeSingle.mockResolvedValue({
      data: {
        id: "lead-1",
        email: "a@b.com",
        user_id: null,
        status: "subscribed",
        source: "footer",
        unsubscribed_at: null,
        unsubscribe_token: "tok",
        created_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    });

    const { createLead } = await import("@/repositories/lead.repository");
    const status = await createLead({ email: "a@b.com" });
    expect(status).toBe("already_subscribed");
  });
});
