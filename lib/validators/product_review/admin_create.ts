import { z } from "zod";
import { reviewBaseSchema } from "./base";

/**
 * Admin create review schema.
 * Allows optional user_id (null = guest) and any review_status.
 */
export const adminCreateReviewSchema = reviewBaseSchema.extend({
  user_id: z.string().uuid("User ID must be a valid UUID").nullable().optional(),
  review_status: z.enum(["pending", "approved", "rejected"], {
    message: "Review status must be pending, approved, or rejected",
  }),
});

export type AdminCreateReviewInput = z.infer<typeof adminCreateReviewSchema>;
