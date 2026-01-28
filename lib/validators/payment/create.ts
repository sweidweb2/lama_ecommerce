import { z } from 'zod';

// Client-initiated payment intent creation (if needed).
// Many payment fields are filled by the backend / gateway.

export const createPaymentSchema = z.object({
  order_id: z.string().uuid(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().max(10).optional(),
  payment_method: z.string().max(50).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

