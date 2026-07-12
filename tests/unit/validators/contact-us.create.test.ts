import { describe, expect, it } from "vitest";
import { createContactUsSchema } from "@/lib/validators/contact_us/create";

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
});
