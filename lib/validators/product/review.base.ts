import { z } from 'zod';

// User-submitted product review.

export const reviewBaseSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).nullable().optional(),
  comment: z.string().max(5000).nullable().optional(),
});

export type ReviewBaseInput = z.infer<typeof reviewBaseSchema>;

