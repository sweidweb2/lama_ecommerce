import { z } from "zod";

// Admin CRUD for promo codes.

export const promoCodeBaseSchema = z.object({
  code: z.string().min(3).max(50),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().nonnegative(),
  expires_at: z.string().max(100).nullable().optional(),
  max_uses: z.number().int().min(1).nullable().optional(),
  is_active: z.boolean().optional().default(true),
});

export type PromoCodeBaseInput = z.infer<typeof promoCodeBaseSchema>;

