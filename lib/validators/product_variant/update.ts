import { z } from "zod";

// Update product variant (admin).
// All fields are optional for partial updates, and nullable fields can be set to null.

export const updateProductVariantSchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID").optional(),
  color: z
    .string()
    .max(30, "Color must be at most 30 characters")
    .nullable()
    .optional(),
  size: z
    .string()
    .max(20, "Size must be at most 20 characters")
    .nullable()
    .optional(),
  material: z
    .string()
    .max(100, "Material must be at most 100 characters")
    .nullable()
    .optional(),
  quantity_stock: z
    .number()
    .int("Stock quantity must be a whole number")
    .min(0, "Stock quantity must be 0 or greater")
    .max(100000, "Stock quantity is too large")
    .optional(),
  sku_variant: z.string().max(255).nullable().optional(),
  price_override: z
    .number()
    .nonnegative("Price override must be 0 or greater")
    .nullable()
    .optional(),
});

export type UpdateProductVariantInput = z.infer<
  typeof updateProductVariantSchema
>;

