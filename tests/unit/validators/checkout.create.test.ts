import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validators/checkout/checkout";

const valid = {
  cart_id: "550e8400-e29b-41d4-a716-446655440000",
  shipping_zone_id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  address: {
    country: "JO",
    city: "Amman",
    address: "Street 1",
    postal_code: "11118",
  },
  phone: "0790000000",
  email: "buyer@example.com",
};

describe("checkoutSchema", () => {
  it("accepts a valid checkout payload", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid cart or zone UUIDs", () => {
    expect(
      checkoutSchema.safeParse({ ...valid, cart_id: "bad" }).success,
    ).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...valid, shipping_zone_id: "bad" }).success,
    ).toBe(false);
  });

  it("rejects missing address fields and bad email", () => {
    expect(
      checkoutSchema.safeParse({
        ...valid,
        address: { ...valid.address, city: "" },
      }).success,
    ).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...valid, email: "nope" }).success,
    ).toBe(false);
  });

  it("defaults empty postal_code", () => {
    const result = checkoutSchema.safeParse({
      ...valid,
      address: {
        country: "JO",
        city: "Amman",
        address: "Street 1",
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.address.postal_code).toBe("");
    }
  });

  it("defaults save_address_mode to create", () => {
    const result = checkoutSchema.safeParse({
      ...valid,
      save_address: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.save_address_mode).toBe("create");
    }
  });

  it("rejects update mode without saved_address_id", () => {
    expect(
      checkoutSchema.safeParse({
        ...valid,
        save_address: true,
        save_address_mode: "update",
      }).success,
    ).toBe(false);
  });

  it("accepts update mode with saved_address_id", () => {
    const result = checkoutSchema.safeParse({
      ...valid,
      save_address: true,
      save_address_mode: "update",
      saved_address_id: "550e8400-e29b-41d4-a716-446655440099",
    });
    expect(result.success).toBe(true);
  });
});
