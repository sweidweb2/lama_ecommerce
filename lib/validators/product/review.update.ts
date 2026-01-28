import { z } from 'zod';
import { reviewBaseSchema } from './review.base';

// Update review (user editing their own review).

export const updateReviewSchema = reviewBaseSchema.partial();

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

