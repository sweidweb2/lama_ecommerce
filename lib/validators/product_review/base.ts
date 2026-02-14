import { z } from "zod";

/**
 * Base schema for product review.
 * Maps to the `reviews` table (excluding server-managed fields).
 * 
 * Fields:
 * - product_id: Required UUID reference to products table
 * - rating: Required integer between 1 and 5
 * - title: Optional string, max 200 characters
 * - comment: Optional string, max 5000 characters
 * 
 * Note: user_id, review_status, created_at, and deleted_at are managed by the server
 */
export const reviewBaseSchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  title: z
    .string()
    .max(200, "Title must be at most 200 characters")
    .nullable()
    .optional(),
  comment: z
    .string()
    .max(5000, "Comment must be at most 5000 characters")
    .nullable()
    .optional(),
});

export type ReviewBaseInput = z.infer<typeof reviewBaseSchema>;

