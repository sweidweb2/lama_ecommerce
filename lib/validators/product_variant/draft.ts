import { z } from "zod";
import { productVariantBaseSchema } from "./base";

/**
 * Variant draft for create-product (product_id assigned after product insert).
 */
export const productVariantDraftSchema = productVariantBaseSchema
  .omit({ product_id: true })
  .transform((data) => ({
    ...data,
    sku_variant:
      data.sku_variant && data.sku_variant.trim()
        ? data.sku_variant.trim()
        : null,
    price_override:
      data.price_override === undefined || Number.isNaN(data.price_override)
        ? null
        : data.price_override,
  }));

export type ProductVariantDraftInput = z.input<typeof productVariantDraftSchema>;
export type ProductVariantDraft = z.output<typeof productVariantDraftSchema>;
