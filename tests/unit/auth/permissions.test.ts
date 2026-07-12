import { describe, expect, it } from "vitest";
import { canAccessAdmin, canEditProfile } from "@/lib/auth/permissions";
import { ROLES } from "@/lib/constants/roles";

describe("canAccessAdmin", () => {
  it("returns true for admin role", () => {
    expect(canAccessAdmin(ROLES.ADMIN)).toBe(true);
  });

  it("returns false for user role", () => {
    expect(canAccessAdmin(ROLES.USER)).toBe(false);
  });

  it("returns false for null or undefined", () => {
    expect(canAccessAdmin(null)).toBe(false);
    expect(canAccessAdmin(undefined)).toBe(false);
  });
});

describe("canEditProfile", () => {
  it("returns true when ids match", () => {
    expect(canEditProfile("user-1", "user-1")).toBe(true);
  });

  it("returns false when ids differ", () => {
    expect(canEditProfile("user-1", "user-2")).toBe(false);
  });

  it("returns false when auth user is missing", () => {
    expect(canEditProfile("user-1", null)).toBe(false);
    expect(canEditProfile("user-1", undefined)).toBe(false);
  });
});
