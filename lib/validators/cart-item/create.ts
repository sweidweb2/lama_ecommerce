import { z } from "zod";
import { cartItemBaseSchema } from "./base";

/**
 * Create cart item schema.
 * 
 * Note: 
 * - cart_id may be optional if the server generates/retrieves it automatically
 * - For client-side add-to-cart actions, customised_product_id and quantity are required
 */
export const createCartItemSchema = cartItemBaseSchema.partial({
  cart_id: true, // cart_id may be server-generated or retrieved automatically
});

export type CreateCartItemInput = z.infer<typeof createCartItemSchema>;

