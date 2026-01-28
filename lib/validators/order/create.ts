import { z } from 'zod';
import { orderBaseSchema } from './base';

// Schema for creating an order at checkout.
// Client never sets status or payment_status directly.

export const createOrderSchema = orderBaseSchema.extend({
  // Optionally allow linking to an authenticated user on the client side.
  user_id: z.string().uuid().nullable().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

