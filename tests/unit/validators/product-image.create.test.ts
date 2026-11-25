import { describe, expect, it } from "vitest";
import { addProductImageSchema } from "@/lib/validators/product_image/create";

const productId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const variantId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

describe("addProductImageSchema", () => {
  it("accepts product_id only", () => {
    const result = addProductImageSchema.safeParse({ product_id: productId });
    expect(result.success).toBe(true);
  });

  it("accepts optional customised_product_id", () => {
    const result = addProductImageSchema.safeParse({
      product_id: productId,
      customised_product_id: variantId,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customised_product_id).toBe(variantId);
    }
  });

  it("accepts null customised_product_id", () => {
    const result = addProductImageSchema.safeParse({
      product_id: productId,
      customised_product_id: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid customised_product_id", () => {
    expect(
      addProductImageSchema.safeParse({
        product_id: productId,
        customised_product_id: "not-a-uuid",
      }).success,
    ).toBe(false);
  });
});
