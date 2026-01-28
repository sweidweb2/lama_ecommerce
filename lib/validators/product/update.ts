import { z } from 'zod';
import { productBaseSchema } from './base';

// Schema for updating an existing product (admin).
// All fields optional; ID is handled separately in routes/actions.

export const updateProductSchema = productBaseSchema.partial();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

