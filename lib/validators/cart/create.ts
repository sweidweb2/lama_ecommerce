import { z } from "zod";
import { cartBaseSchema } from "./base";

/**
 * Create cart schema.
 * 
 * Note: 
 * - For authenticated users, user_id is typically set by the server from auth.uid()
 * - For guests, session_id should be provided
 * - The server will ensure at least one of user_id or session_id is present
 */
export const createCartSchema = cartBaseSchema.partial({
  user_id: true, // user_id is optional as it's set by server for authenticated users
});

export type CreateCartInput = z.infer<typeof createCartSchema>;
