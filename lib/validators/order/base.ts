import { z } from 'zod';

// Base schema for order data coming from checkout.
// We only validate what the client sends; server sets status/payment_status.

export const orderBaseSchema = z.object({
  subtotal: z.number().nonnegative(),
  shipping_fee: z.number().nonnegative(),
  discount: z.number().nonnegative().optional().default(0),
  total: z.number().nonnegative(),
  phone: z.string().min(5).max(30),
  email: z.string().email(),
  // Shape of address_snapshot is app-defined; treat as unknown but require object.
  address_snapshot: z.record(z.any()),
});

export type OrderBaseInput = z.infer<typeof orderBaseSchema>;

