import { z } from "zod";
import { reviewBaseSchema } from "./base";

/**
 * Update review schema for users editing their own reviews.
 * All fields are optional since users may only want to update specific fields.
 * 
 * Note: Users can only update rating, title, and comment.
 * review_status can only be updated by admins.
 */
export const updateReviewSchema = reviewBaseSchema.partial();

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

