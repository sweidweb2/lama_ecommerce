import { describe, expect, it } from "vitest";
import { getLoginAuthBannerMessage } from "@/lib/auth/login-banner";

describe("getLoginAuthBannerMessage", () => {
  it("returns inactive account message for reason=inactive", () => {
    expect(
      getLoginAuthBannerMessage({ reason: "inactive", error: null }),
    ).toBe("Your account is inactive. Please contact support for help.");
  });

  it("returns idle session message for reason=idle", () => {
    expect(getLoginAuthBannerMessage({ reason: "idle", error: null })).toBe(
      "Your session expired due to inactivity. Please sign in again.",
    );
  });

  it("returns callback failure message for error=auth_callback_error", () => {
    expect(
      getLoginAuthBannerMessage({
        reason: null,
        error: "auth_callback_error",
      }),
    ).toBe("Sign-in link failed or expired. Please try signing in again.");
  });

  it("returns null when params are unrelated", () => {
    expect(
      getLoginAuthBannerMessage({ reason: "other", error: "other" }),
    ).toBeNull();
  });

  it("prefers inactive reason when both params are present", () => {
    expect(
      getLoginAuthBannerMessage({
        reason: "inactive",
        error: "auth_callback_error",
      }),
    ).toBe("Your account is inactive. Please contact support for help.");
  });
});
