import { describe, expect, it } from "vitest";
import { isInvalidRefreshTokenError } from "@/lib/auth/refresh-token";

describe("isInvalidRefreshTokenError", () => {
  it("returns false for null/undefined", () => {
    expect(isInvalidRefreshTokenError(null)).toBe(false);
    expect(isInvalidRefreshTokenError(undefined)).toBe(false);
  });

  it("detects message variants", () => {
    expect(
      isInvalidRefreshTokenError({
        message: "Invalid Refresh Token: Refresh Token Not Found",
      }),
    ).toBe(true);
    expect(
      isInvalidRefreshTokenError({ message: "refresh_token is invalid" }),
    ).toBe(true);
  });

  it("detects code variants", () => {
    expect(
      isInvalidRefreshTokenError({ code: "refresh_token_not_found" }),
    ).toBe(true);
    expect(isInvalidRefreshTokenError({ code: "invalid_refresh_token" })).toBe(
      true,
    );
  });

  it("ignores unrelated auth errors", () => {
    expect(
      isInvalidRefreshTokenError({ message: "Invalid login credentials" }),
    ).toBe(false);
    expect(isInvalidRefreshTokenError({ code: "user_not_found" })).toBe(false);
  });
});
