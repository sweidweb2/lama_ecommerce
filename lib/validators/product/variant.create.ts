import { z } from 'zod';
import { productVariantBaseSchema } from './variant.base';

// Create product variant (admin).

export const createProductVariantSchema = productVariantBaseSchema;

export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>;

