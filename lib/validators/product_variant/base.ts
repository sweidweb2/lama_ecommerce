import { z } from "zod";

// Admin CRUD for customised_products (variants).

export const productVariantBaseSchema = z.object({
  product_id: z.string().uuid(),
  color: z.string().max(100).nullable().optional(),
  size: z.string().max(50).nullable().optional(),
  material: z.string().max(100).nullable().optional(),
  quantity_stock: z.number().int().min(0).optional(),
  sku_variant: z.string().max(255).nullable().optional(),
  price_override: z.number().nonnegative().nullable().optional(),
});

export type ProductVariantBaseInput = z.infer<typeof productVariantBaseSchema>;

