import { describe, expect, it } from "vitest";
import { createProductSchema } from "@/lib/validators/product/create";

describe("createProductSchema", () => {
  const valid = {
    name: "Linen Shirt",
    price: 29.99,
  };

  it("accepts minimal valid product", () => {
    const result = createProductSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(true);
      expect(result.data.is_featured).toBe(false);
    }
  });

  it("rejects empty name and non-positive price", () => {
    expect(
      createProductSchema.safeParse({ ...valid, name: "" }).success,
    ).toBe(false);
    expect(
      createProductSchema.safeParse({ ...valid, price: 0 }).success,
    ).toBe(false);
  });

  it("rejects invalid slug and sku patterns", () => {
    expect(
      createProductSchema.safeParse({
        ...valid,
        slug: "Bad Slug",
      }).success,
    ).toBe(false);
    expect(
      createProductSchema.safeParse({
        ...valid,
        sku: "lower-case",
      }).success,
    ).toBe(false);
  });

  it("accepts valid slug and sku", () => {
    expect(
      createProductSchema.safeParse({
        ...valid,
        slug: "linen-shirt",
        sku: "PROD-001",
      }).success,
    ).toBe(true);
  });
});
