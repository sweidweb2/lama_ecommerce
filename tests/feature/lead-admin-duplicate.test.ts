import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const createLeadAdmin = vi.fn();
const updateLead = vi.fn();

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/repositories/lead.repository", () => ({
  createLead: vi.fn(),
  createLeadAdmin: (...args: unknown[]) => createLeadAdmin(...args),
  getAllLeads: vi.fn(),
  listLeads: vi.fn(),
  listLeadsForExport: vi.fn(),
  updateLead: (...args: unknown[]) => updateLead(...args),
  deleteLead: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("lead admin actions duplicate handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue(undefined);
  });

  it("createLeadAdminAction returns duplicate error", async () => {
    createLeadAdmin.mockResolvedValue({ ok: false, error: "duplicate" });
    const { createLeadAdminAction } = await import("@/actions/lead");
    const result = await createLeadAdminAction({ email: "dup@example.com" });
    expect(result).toEqual({
      success: false,
      error: "A lead with this email already exists.",
    });
  });

  it("updateLeadAction returns duplicate error", async () => {
    updateLead.mockResolvedValue({ ok: false, error: "duplicate" });
    const { updateLeadAction } = await import("@/actions/lead");
    const result = await updateLeadAction({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "dup@example.com",
    });
    expect(result).toEqual({
      success: false,
      error: "A lead with this email already exists.",
    });
  });
});
