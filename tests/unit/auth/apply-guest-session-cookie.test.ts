import { describe, expect, it } from "vitest";
import { resolveGuestSessionCookie } from "@/lib/auth/apply-guest-session-cookie";
import { GUEST_SESSION_MAX_AGE } from "@/lib/auth/guest-session.constants";

describe("resolveGuestSessionCookie", () => {
  it("slides maxAge for a valid existing UUID without minting", () => {
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const decision = resolveGuestSessionCookie(id, { secure: false });

    expect(decision.value).toBe(id);
    expect(decision.minted).toBe(false);
    expect(decision.options).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: GUEST_SESSION_MAX_AGE,
      path: "/",
    });
  });

  it("mints a new UUID when cookie is missing", () => {
    const minted = "11111111-2222-3333-4444-555555555555";
    const decision = resolveGuestSessionCookie(null, {
      secure: true,
      mintId: () => minted,
    });

    expect(decision.value).toBe(minted);
    expect(decision.minted).toBe(true);
    expect(decision.options.secure).toBe(true);
    expect(decision.options.maxAge).toBe(GUEST_SESSION_MAX_AGE);
  });

  it("mints a new UUID when cookie is invalid", () => {
    const minted = "99999999-8888-7777-6666-555555555555";
    const decision = resolveGuestSessionCookie("legacy-bad", {
      mintId: () => minted,
    });

    expect(decision.value).toBe(minted);
    expect(decision.minted).toBe(true);
  });
});
