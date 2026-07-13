import { z } from "zod";

/** Admin upsert of a payment row (virtual paid / manual sync until Stripe). */
export const upsertPaymentSchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum(["pending", "paid", "failed", "refunded"]),
  amount: z.number().nonnegative().nullable().optional(),
  currency: z.string().max(10).nullable().optional(),
  transaction_id: z.string().max(200).nullable().optional(),
  paid_at: z.string().nullable().optional(),
  gateway: z.string().max(100).nullable().optional(),
  payment_method: z.string().max(50).nullable().optional(),
  payment_url: z.string().max(2000).nullable().optional(),
});

export type UpsertPaymentInput = z.infer<typeof upsertPaymentSchema>;
