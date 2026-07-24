import { describe, expect, it } from "vitest";
import { createProductWithVariantsSchema } from "@/lib/validators/product/create_with_variants";

const validProduct = {
  name: "Test Tee",
  description: "Soft cotton tee",
  slug: "test-tee",
  brand_id: null,
  category_id: null,
  sku: "TEE-001",
  price: 29.99,
  is_featured: false,
  is_trending: false,
  is_active: true,
};

const validVariant = {
  color: "#000000",
  size: "M",
  material: "Cotton",
  quantity_stock: 10,
  sku_variant: "TEE-001-BLK-M",
  price_override: null,
};

describe("createProductWithVariantsSchema", () => {
  it("accepts a product with one valid variant", () => {
    const result = createProductWithVariantsSchema.safeParse({
      ...validProduct,
      variants: [validVariant],
    });
    expect(result.success).toBe(true);
  });

  it("rejects when variants array is empty", () => {
    const result = createProductWithVariantsSchema.safeParse({
      ...validProduct,
      variants: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid variant fields", () => {
    const result = createProductWithVariantsSchema.safeParse({
      ...validProduct,
      variants: [
        {
          ...validVariant,
          color: "",
          quantity_stock: -1,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate color/size/material within the form", () => {
    const result = createProductWithVariantsSchema.safeParse({
      ...validProduct,
      variants: [validVariant, { ...validVariant, sku_variant: "OTHER" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.toLowerCase().includes("duplicate"),
        ),
      ).toBe(true);
    }
  });

  it("rejects duplicate variant SKUs within the form", () => {
    const result = createProductWithVariantsSchema.safeParse({
      ...validProduct,
      variants: [
        validVariant,
        {
          ...validVariant,
          size: "L",
          sku_variant: "tee-001-blk-m",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("normalizes empty sku_variant to null", () => {
    const result = createProductWithVariantsSchema.safeParse({
      ...validProduct,
      variants: [{ ...validVariant, sku_variant: "  " }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variants[0].sku_variant).toBeNull();
    }
  });
});
