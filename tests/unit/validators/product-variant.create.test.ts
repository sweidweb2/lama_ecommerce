import { describe, expect, it } from "vitest";
import { createProductVariantSchema } from "@/lib/validators/product_variant/create";

const productId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("createProductVariantSchema", () => {
  const valid = {
    product_id: productId,
    color: "Navy",
    size: "M",
    material: "Cotton",
    quantity_stock: 10,
  };

  it("accepts a valid variant", () => {
    expect(createProductVariantSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid product id and negative stock", () => {
    expect(
      createProductVariantSchema.safeParse({
        ...valid,
        product_id: "bad",
      }).success,
    ).toBe(false);
    expect(
      createProductVariantSchema.safeParse({
        ...valid,
        quantity_stock: -1,
      }).success,
    ).toBe(false);
  });
});
