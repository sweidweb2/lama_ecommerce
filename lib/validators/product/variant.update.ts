import { z } from 'zod';
import { productVariantBaseSchema } from './variant.base';

// Update product variant (admin).

export const updateProductVariantSchema = productVariantBaseSchema.partial();

export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>;

