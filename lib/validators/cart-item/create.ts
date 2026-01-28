import { z } from 'zod';

// Client add-to-cart action.

export const createCartItemSchema = z.object({
  cart_id: z.string().uuid().optional(), // may be server-generated
  customised_product_id: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export type CreateCartItemInput = z.infer<typeof createCartItemSchema>;

