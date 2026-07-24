import { z } from "zod";
import { productBaseSchema } from "./base";
import { productVariantDraftSchema } from "@/lib/validators/product_variant/draft";

function variantAttrKey(color: string, size: string, material: string): string {
  return `${color.trim().toLowerCase()}|${size.trim().toLowerCase()}|${material.trim().toLowerCase()}`;
}

/**
 * Create product together with one or more variants (admin create form).
 */
export const createProductWithVariantsSchema = productBaseSchema
  .extend({
    variants: z
      .array(productVariantDraftSchema)
      .min(1, "Add at least one product variant"),
  })
  .superRefine((data, ctx) => {
    const seenAttrs = new Set<string>();
    const seenSkus = new Set<string>();

    data.variants.forEach((variant, index) => {
      const attrKey = variantAttrKey(
        variant.color,
        variant.size,
        variant.material,
      );
      if (seenAttrs.has(attrKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Duplicate variant: color, size, and material must be unique",
          path: ["variants", index, "color"],
        });
      } else {
        seenAttrs.add(attrKey);
      }

      const sku = variant.sku_variant?.trim();
      if (sku) {
        const skuKey = sku.toUpperCase();
        if (seenSkus.has(skuKey)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Duplicate variant SKU in this form",
            path: ["variants", index, "sku_variant"],
          });
        } else {
          seenSkus.add(skuKey);
        }
      }
    });
  });

export type CreateProductWithVariantsInput = z.infer<
  typeof createProductWithVariantsSchema
>;
export type CreateProductWithVariantsSchemaInput = z.input<
  typeof createProductWithVariantsSchema
>;
