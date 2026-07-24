import { z } from "zod";
import { reviewBaseSchema } from "./base";

/**
 * Create review schema for user-submitted reviews.
 *
 * Note: user_id is set automatically by the server from auth.uid()
 * and review_status is set to 'pending' (RLS + moderation queue).
 * Comment is required for customer storefront reviews.
 */
export const createReviewSchema = reviewBaseSchema.extend({
  comment: z
    .string()
    .trim()
    .min(1, "Please provide a comment with your review")
    .max(5000, "Comment must be at most 5000 characters"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
