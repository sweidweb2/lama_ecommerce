import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const set = vi.fn();
const del = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get,
    set,
    delete: del,
  })),
}));

describe("guest-session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getGuestSessionId returns null when cookie missing", async () => {
    get.mockReturnValue(undefined);
    const { getGuestSessionId } = await import("@/lib/auth/guest-session");
    await expect(getGuestSessionId()).resolves.toBeNull();
  });

  it("getGuestSessionId returns null for non-UUID cookie", async () => {
    get.mockReturnValue({ value: "not-a-uuid" });
    const { getGuestSessionId } = await import("@/lib/auth/guest-session");
    await expect(getGuestSessionId()).resolves.toBeNull();
  });

  it("getGuestSessionId returns valid UUID cookie", async () => {
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    get.mockReturnValue({ value: id });
    const { getGuestSessionId } = await import("@/lib/auth/guest-session");
    await expect(getGuestSessionId()).resolves.toBe(id);
  });

  it("setGuestSessionCookie writes httpOnly lax cookie", async () => {
    const { setGuestSessionCookie, GUEST_SESSION_COOKIE, GUEST_SESSION_MAX_AGE } =
      await import("@/lib/auth/guest-session");
    const id = "11111111-2222-3333-4444-555555555555";
    await setGuestSessionCookie(id);
    expect(set).toHaveBeenCalledWith(
      GUEST_SESSION_COOKIE,
      id,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        maxAge: GUEST_SESSION_MAX_AGE,
        path: "/",
      }),
    );
  });

  it("clearGuestSessionCookie deletes the cookie", async () => {
    const { clearGuestSessionCookie, GUEST_SESSION_COOKIE } = await import(
      "@/lib/auth/guest-session"
    );
    await clearGuestSessionCookie();
    expect(del).toHaveBeenCalledWith(GUEST_SESSION_COOKIE);
  });

  it("getOrCreateGuestSessionId reuses valid cookie without rewriting it", async () => {
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    get.mockReturnValue({ value: id });
    const { getOrCreateGuestSessionId } = await import(
      "@/lib/auth/guest-session"
    );
    await expect(getOrCreateGuestSessionId()).resolves.toBe(id);
    expect(set).not.toHaveBeenCalled();
  });

  it("getOrCreateGuestSessionId mints UUID when cookie invalid", async () => {
    get.mockReturnValue({ value: "legacy-bad" });
    const { getOrCreateGuestSessionId } = await import(
      "@/lib/auth/guest-session"
    );
    const id = await getOrCreateGuestSessionId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(set).toHaveBeenCalled();
  });
});
