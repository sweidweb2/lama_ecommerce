import { z } from "zod";

/**
 * Base schema for cart.
 * Maps to the `carts` table (excluding server-managed fields).
 * 
 * Fields:
 * - user_id: Optional UUID reference to auth.users (set by server from auth.uid() for authenticated users)
 * - session_id: Optional text for guest sessions
 * 
 * Note: 
 * - Either user_id OR session_id must be present (enforced by database check constraint)
 * - id, created_at, updated_at, and deleted_at are managed by the server
 */
export const cartBaseSchema = z.object({
  user_id: z
    .string()
    .uuid("User ID must be a valid UUID")
    .nullable()
    .optional(),
  session_id: z
    .string()
    .min(1, "Session ID cannot be empty")
    .nullable()
    .optional(),
}).refine(
  (data) => data.user_id !== null || data.session_id !== null,
  {
    message: "Either user_id or session_id must be provided",
    path: ["user_id"],
  }
);

export type CartBaseInput = z.infer<typeof cartBaseSchema>;
