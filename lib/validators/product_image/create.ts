import { z } from 'zod';

export const addProductImageSchema = z.object({
  product_id: z.string().uuid('Product ID must be a valid UUID'),
  customised_product_id: z
    .string()
    .uuid('Variant ID must be a valid UUID')
    .nullable()
    .optional(),
});

export type AddProductImageInput = z.infer<typeof addProductImageSchema>;
