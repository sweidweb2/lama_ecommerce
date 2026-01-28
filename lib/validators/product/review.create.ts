import { z } from 'zod';
import { reviewBaseSchema } from './review.base';

// Create review: product_id + rating + optional title/comment.

export const createReviewSchema = reviewBaseSchema.extend({
  user_id: z.string().uuid().nullable().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

