import { z } from 'zod';

export const addProductImageSchema = z.object({
  product_id: z.string().uuid('Product ID must be a valid UUID'),
});

export type AddProductImageInput = z.infer<typeof addProductImageSchema>;
