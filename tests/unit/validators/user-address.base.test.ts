import { describe, expect, it } from "vitest";
import { addressBaseSchema } from "@/lib/validators/user_address/base";

describe("addressBaseSchema", () => {
  const valid = {
    country: "United States",
    city: "Austin",
    address: "123 Main St",
    postal_code: "78701",
    phone: "+1 (512) 555-1234",
    is_default: false,
  };

  it("accepts a valid address payload", () => {
    const result = addressBaseSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+1 (512) 555-1234");
      expect(result.data.country).toBe("United States");
    }
  });

  it("trims country, city, and address", () => {
    const result = addressBaseSchema.safeParse({
      ...valid,
      country: "  Canada  ",
      city: "  Toronto ",
      address: "  1 King St ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.country).toBe("Canada");
      expect(result.data.city).toBe("Toronto");
      expect(result.data.address).toBe("1 King St");
    }
  });

  it("rejects empty country", () => {
    expect(
      addressBaseSchema.safeParse({ ...valid, country: "" }).success,
    ).toBe(false);
    expect(
      addressBaseSchema.safeParse({ ...valid, country: "   " }).success,
    ).toBe(false);
  });

  it("rejects junk phone with letters", () => {
    expect(
      addressBaseSchema.safeParse({ ...valid, phone: "aaaaaaaa" }).success,
    ).toBe(false);
  });

  it("rejects phone with fewer than 8 digits", () => {
    expect(
      addressBaseSchema.safeParse({ ...valid, phone: "1234567" }).success,
    ).toBe(false);
  });

  it("rejects phone with more than 15 digits", () => {
    expect(
      addressBaseSchema.safeParse({
        ...valid,
        phone: "1234567890123456",
      }).success,
    ).toBe(false);
  });

  it("accepts 8–15 digit phones with formatting", () => {
    expect(
      addressBaseSchema.safeParse({ ...valid, phone: "12345678" }).success,
    ).toBe(true);
    expect(
      addressBaseSchema.safeParse({
        ...valid,
        phone: "+44 7700 900123",
      }).success,
    ).toBe(true);
  });
});
