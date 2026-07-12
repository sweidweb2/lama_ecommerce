import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { ROUTES } from "@/lib/constants/routes";

describe("safeRedirectPath", () => {
  it("returns relative paths as-is", () => {
    expect(safeRedirectPath("/products")).toBe("/products");
    expect(safeRedirectPath("/account/profile")).toBe("/account/profile");
  });

  it("falls back when candidate is empty", () => {
    expect(safeRedirectPath(null)).toBe(ROUTES.HOME);
    expect(safeRedirectPath(undefined)).toBe(ROUTES.HOME);
    expect(safeRedirectPath("")).toBe(ROUTES.HOME);
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(safeRedirectPath("//evil.com")).toBe(ROUTES.HOME);
    expect(safeRedirectPath("https://evil.com")).toBe(ROUTES.HOME);
    expect(safeRedirectPath("http://evil.com/path")).toBe(ROUTES.HOME);
  });

  it("rejects backslash tricks", () => {
    expect(safeRedirectPath("/\\evil.com")).toBe(ROUTES.HOME);
    expect(safeRedirectPath("\\evil")).toBe(ROUTES.HOME);
  });

  it("rejects encoded protocol-relative tricks", () => {
    expect(safeRedirectPath("/%2F%2Fevil.com")).toBe(ROUTES.HOME);
  });

  it("uses custom fallback when provided", () => {
    expect(safeRedirectPath(null, "/cart")).toBe("/cart");
  });
});
