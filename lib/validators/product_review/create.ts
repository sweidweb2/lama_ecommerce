import { z } from "zod";
import { reviewBaseSchema } from "./base";

/**
 * Create review schema for user-submitted reviews.
 * 
 * Note: user_id is set automatically by the server from auth.uid()
 * and review_status is set to 'approved' when the review is created.
 */
export const createReviewSchema = reviewBaseSchema;

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

