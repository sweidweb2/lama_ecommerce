import { describe, expect, it } from "vitest";
import {
  CONTACT_US_FIELD_MAX,
  createContactUsSchema,
} from "@/lib/validators/contact_us/create";

describe("createContactUsSchema", () => {
  const valid = {
    full_name: "Jane Doe",
    email: "jane@example.com",
    subject: "Hello",
    message: "I need help with my order.",
    phone: "1234567890",
  };

  it("accepts a valid payload", () => {
    const result = createContactUsSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.full_name).toBe("Jane Doe");
      expect(result.data.phone).toBe("1234567890");
    }
  });

  it("rejects empty name or message", () => {
    expect(
      createContactUsSchema.safeParse({ ...valid, full_name: "" }).success,
    ).toBe(false);
    expect(
      createContactUsSchema.safeParse({ ...valid, message: "" }).success,
    ).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(
      createContactUsSchema.safeParse({ ...valid, email: "not-an-email" })
        .success,
    ).toBe(false);
  });

  it("transforms blank phone to null", () => {
    const result = createContactUsSchema.safeParse({
      ...valid,
      phone: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeNull();
    }
  });

  it("accepts values at the storefront max caps", () => {
    const result = createContactUsSchema.safeParse({
      ...valid,
      full_name: "a".repeat(CONTACT_US_FIELD_MAX.full_name),
      subject: "b".repeat(CONTACT_US_FIELD_MAX.subject),
      message: "c".repeat(CONTACT_US_FIELD_MAX.message),
      phone: "1".repeat(CONTACT_US_FIELD_MAX.phone),
    });
    expect(result.success).toBe(true);
  });

  it("rejects values over the storefront max caps", () => {
    expect(
      createContactUsSchema.safeParse({
        ...valid,
        full_name: "a".repeat(CONTACT_US_FIELD_MAX.full_name + 1),
      }).success,
    ).toBe(false);
    expect(
      createContactUsSchema.safeParse({
        ...valid,
        subject: "b".repeat(CONTACT_US_FIELD_MAX.subject + 1),
      }).success,
    ).toBe(false);
    expect(
      createContactUsSchema.safeParse({
        ...valid,
        message: "c".repeat(CONTACT_US_FIELD_MAX.message + 1),
      }).success,
    ).toBe(false);
    expect(
      createContactUsSchema.safeParse({
        ...valid,
        phone: "1".repeat(CONTACT_US_FIELD_MAX.phone + 1),
      }).success,
    ).toBe(false);
  });
});
