import { z } from "zod";
import { cartBaseSchema } from "./base";

/**
 * Update cart schema.
 * All fields are optional since you may only want to update specific fields.
 * 
 * Note: Typically used for updating session_id when a guest logs in
 * (to migrate cart from session_id to user_id).
 */
export const updateCartSchema = cartBaseSchema.partial();

export type UpdateCartInput = z.infer<typeof updateCartSchema>;
