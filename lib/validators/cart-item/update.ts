import { z } from "zod";
import { cartItemBaseSchema } from "./base";

/**
 * Update cart item schema.
 * All fields are optional since you may only want to update specific fields.
 * 
 * Note: Typically used for updating quantity of an existing cart item.
 */
export const updateCartItemSchema = cartItemBaseSchema.partial();

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
