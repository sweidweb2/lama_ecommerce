import { describe, expect, it } from "vitest";
import { cartBaseSchema } from "@/lib/validators/cart/base";

/**
 * Wave 2 tests the cart base schema (createCartSchema.partial() currently
 * throws under Zod 4 when the base has refinements — covered as a known gap).
 */
describe("cartBaseSchema", () => {
  it("accepts session_id only (guest)", () => {
    expect(
      cartBaseSchema.safeParse({
        session_id: "guest-session-1",
      }).success,
    ).toBe(true);
  });

  it("accepts user_id only", () => {
    expect(
      cartBaseSchema.safeParse({
        user_id: "550e8400-e29b-41d4-a716-446655440000",
      }).success,
    ).toBe(true);
  });

  it("rejects when both user_id and session_id are null", () => {
    expect(
      cartBaseSchema.safeParse({
        user_id: null,
        session_id: null,
      }).success,
    ).toBe(false);
  });

  it("rejects empty session_id string", () => {
    expect(
      cartBaseSchema.safeParse({
        session_id: "",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid user_id UUID", () => {
    expect(
      cartBaseSchema.safeParse({
        user_id: "not-a-uuid",
      }).success,
    ).toBe(false);
  });
});
