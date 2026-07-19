import { beforeEach, describe, expect, it, vi } from "vitest";

const checkFormRateLimit = vi.fn();
const getClientIpFromHeaders = vi.fn();
const getCurrentAuthUserFromAction = vi.fn();
const createContactUs = vi.fn();
const createLead = vi.fn();

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

vi.mock("@/services/contact_us.service", () => ({
  createContactUs: (...args: unknown[]) => createContactUs(...args),
  getAllContactUs: vi.fn(),
  getContactUsById: vi.fn(),
  updateContactUs: vi.fn(),
  updateContactStatus: vi.fn(),
  deleteContactUs: vi.fn(),
}));

vi.mock("@/repositories/lead.repository", () => ({
  createLead: (...args: unknown[]) => createLead(...args),
  createLeadAdmin: vi.fn(),
  getAllLeads: vi.fn(),
  listLeads: vi.fn(),
  listLeadsForExport: vi.fn(),
  updateLead: vi.fn(),
  deleteLead: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const contactPayload = {
  full_name: "Jane Doe",
  email: "jane@example.com",
  subject: "Hello",
  message: "Need help",
  phone: null as string | null,
};

describe("contact and lead public actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getClientIpFromHeaders.mockResolvedValue("1.2.3.4");
    checkFormRateLimit.mockResolvedValue(true);
    getCurrentAuthUserFromAction.mockResolvedValue(null);
  });

  it("createContactUsAction honeypot returns success without insert", async () => {
    const { createContactUsAction } = await import("@/actions/contact_us");
    const result = await createContactUsAction({
      ...contactPayload,
      website: "http://spam.bot",
    });
    expect(result).toEqual({ success: true });
    expect(createContactUs).not.toHaveBeenCalled();
    expect(checkFormRateLimit).not.toHaveBeenCalled();
  });

  it("createContactUsAction returns rate-limit error", async () => {
    checkFormRateLimit.mockResolvedValue(false);
    const { createContactUsAction } = await import("@/actions/contact_us");
    const result = await createContactUsAction(contactPayload);
    expect(result).toEqual({
      success: false,
      error: "Too many submissions. Try again later.",
    });
    expect(createContactUs).not.toHaveBeenCalled();
  });

  it("createContactUsAction validates before rate limit", async () => {
    const { createContactUsAction } = await import("@/actions/contact_us");
    const result = await createContactUsAction({
      ...contactPayload,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/email/i);
      expect(result.fieldErrors?.email).toBeTruthy();
    }
    expect(checkFormRateLimit).not.toHaveBeenCalled();
    expect(createContactUs).not.toHaveBeenCalled();
  });

  it("createContactUsAction happy path inserts once", async () => {
    createContactUs.mockResolvedValue({ success: true });
    const { createContactUsAction } = await import("@/actions/contact_us");
    const result = await createContactUsAction(contactPayload);
    expect(result).toEqual({ success: true });
    expect(createContactUs).toHaveBeenCalledTimes(1);
  });

  it("createLeadAction honeypot returns success without insert", async () => {
    const formData = new FormData();
    formData.set("email", "lead@example.com");
    formData.set("website", "bot-filled");
    const { createLeadAction } = await import("@/actions/lead");
    const result = await createLeadAction(formData);
    expect(result).toEqual({ success: true, outcome: "created" });
    expect(createLead).not.toHaveBeenCalled();
  });

  it("createLeadAction returns rate-limit error", async () => {
    checkFormRateLimit.mockResolvedValue(false);
    const formData = new FormData();
    formData.set("email", "lead@example.com");
    const { createLeadAction } = await import("@/actions/lead");
    const result = await createLeadAction(formData);
    expect(result).toEqual({
      success: false,
      error: "Too many submissions. Try again later.",
    });
    expect(createLead).not.toHaveBeenCalled();
  });

  it("createLeadAction happy path inserts once", async () => {
    createLead.mockResolvedValue("created");
    const formData = new FormData();
    formData.set("email", "lead@example.com");
    const { createLeadAction } = await import("@/actions/lead");
    const result = await createLeadAction(formData);
    expect(result).toEqual({ success: true, outcome: "created" });
    expect(createLead).toHaveBeenCalledTimes(1);
    expect(createLead).toHaveBeenCalledWith(
      { email: "lead@example.com" },
      null,
    );
  });

  it("createLeadAction passes auth user_id when logged in", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue({ id: "user-1" });
    createLead.mockResolvedValue("created");
    const formData = new FormData();
    formData.set("email", "lead@example.com");
    const { createLeadAction } = await import("@/actions/lead");
    const result = await createLeadAction(formData);
    expect(result).toEqual({ success: true, outcome: "created" });
    expect(createLead).toHaveBeenCalledWith(
      { email: "lead@example.com" },
      "user-1",
    );
  });

  it("createLeadAction treats duplicate as already_subscribed success", async () => {
    createLead.mockResolvedValue("already_subscribed");
    const formData = new FormData();
    formData.set("email", "  Foo@X.com  ");
    const { createLeadAction } = await import("@/actions/lead");
    const result = await createLeadAction(formData);
    expect(result).toEqual({
      success: true,
      outcome: "already_subscribed",
    });
    expect(createLead).toHaveBeenCalledWith({ email: "foo@x.com" }, null);
  });
});
