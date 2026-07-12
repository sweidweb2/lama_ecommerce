import { z } from "zod";

/**
 * Base schema for cart item.
 * Maps to the `cart_items` table (excluding server-managed fields).
 * 
 * Fields:
 * - cart_id: Required UUID reference to carts table
 * - customised_product_id: Required UUID reference to customised_products table
 * - quantity: Required integer, minimum 1
 * 
 * Note: id and created_at are managed by the server
 */
export const cartItemBaseSchema = z.object({
  cart_id: z.string().uuid("Cart ID must be a valid UUID"),
  customised_product_id: z
    .string()
    .uuid("Customised product ID must be a valid UUID"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
});

export type CartItemBaseInput = z.infer<typeof cartItemBaseSchema>;
