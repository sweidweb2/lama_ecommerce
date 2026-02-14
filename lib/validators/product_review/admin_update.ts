import { z } from "zod";
import { reviewBaseSchema } from "./base";

/**
 * Admin update review schema.
 * Allows admins to update all review fields including review_status.
 */
export const adminUpdateReviewSchema = reviewBaseSchema
  .partial()
  .extend({
    review_status: z
      .enum(["pending", "approved", "rejected"], {
        message: "Review status must be pending, approved, or rejected",
      })
      .optional(),
  });

export type AdminUpdateReviewInput = z.infer<typeof adminUpdateReviewSchema>;
