import { describe, expect, it } from "vitest";
import {
  ADMIN_CANNOT_SHOP_MESSAGE,
  assertCanShopAsCustomer,
  canAccessAdmin,
  canEditProfile,
  canShopAsCustomer,
} from "@/lib/auth/permissions";
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

describe("canShopAsCustomer", () => {
  it("returns true for user role", () => {
    expect(canShopAsCustomer(ROLES.USER)).toBe(true);
  });

  it("returns false for admin role", () => {
    expect(canShopAsCustomer(ROLES.ADMIN)).toBe(false);
  });

  it("returns false for null or undefined", () => {
    expect(canShopAsCustomer(null)).toBe(false);
    expect(canShopAsCustomer(undefined)).toBe(false);
  });
});

describe("assertCanShopAsCustomer", () => {
  it("throws for admin role", () => {
    expect(() => assertCanShopAsCustomer(ROLES.ADMIN)).toThrow(
      ADMIN_CANNOT_SHOP_MESSAGE,
    );
  });

  it("does not throw for user role", () => {
    expect(() => assertCanShopAsCustomer(ROLES.USER)).not.toThrow();
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
