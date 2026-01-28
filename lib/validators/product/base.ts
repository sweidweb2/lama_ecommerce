import { z } from 'zod';

// Base schema for product input coming from admin forms.
// Maps to the `products` table (excluding server-managed fields).

export const productBaseSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
  slug: z.string().min(1).max(255),
  brand_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  sku: z.string().max(255).nullable().optional(),
  price: z.number().nonnegative(),
  is_featured: z.boolean().optional().default(false),
  is_trending: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
});

export type ProductBaseInput = z.infer<typeof productBaseSchema>;

