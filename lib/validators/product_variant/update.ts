import { z } from "zod";
import { productVariantBaseSchema } from "./base";

// Update product variant (admin).

export const updateProductVariantSchema = productVariantBaseSchema.partial();

export type UpdateProductVariantInput = z.infer<
  typeof updateProductVariantSchema
>;

