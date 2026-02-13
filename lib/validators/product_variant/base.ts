import { z } from "zod";

// Admin CRUD for customised_products (variants).

export const productVariantBaseSchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  color: z
    .string()
    .min(1, "Color is required")
    .max(30, "Color must be at most 30 characters"),
  size: z
    .string()
    .min(1, "Size is required")
    .max(20, "Size must be at most 20 characters"),
  material: z
    .string()
    .min(1, "Material is required")
    .max(100, "Material must be at most 100 characters"),
  quantity_stock: z
    .number()
    .int("Stock quantity must be a whole number")
    .min(0, "Stock quantity must be 0 or greater")
    .max(100000, "Stock quantity is too large"),
  sku_variant: z.string().max(255).nullable().optional(),
  price_override: z
    .number()
    .nonnegative("Price override must be 0 or greater")
    .nullable()
    .optional(),
});

export type ProductVariantBaseInput = z.infer<typeof productVariantBaseSchema>;

