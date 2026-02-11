import { z } from "zod";
import { reviewBaseSchema } from "./base";

// Update review (user editing their own review).

export const updateReviewSchema = reviewBaseSchema.partial();

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

