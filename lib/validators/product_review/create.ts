import { z } from "zod";
import { reviewBaseSchema } from "./base";

/**
 * Create review schema for user-submitted reviews.
 * 
 * Note: user_id is set automatically by the server from auth.uid()
 * and review_status defaults to 'pending' in the database.
 */
export const createReviewSchema = reviewBaseSchema;

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

