import { z } from "zod";
import {
  promoCodeBaseObjectSchema,
  promoCodeBaseSchema,
  refinePromoPercentageDiscount,
} from "./base";

// Update promo code (admin) – partial fields.
export const updatePromoCodeSchema = refinePromoPercentageDiscount(
  promoCodeBaseObjectSchema.partial(),
);

export type UpdatePromoCodeInput = z.infer<typeof updatePromoCodeSchema>;

// Full update payload (e.g. from edit form) – id + all fields.
export const updatePromoCodeFullSchema = refinePromoPercentageDiscount(
  z.object({ id: z.string().uuid() }).merge(promoCodeBaseObjectSchema),
);

export type UpdatePromoCodeFullInput = z.infer<typeof updatePromoCodeFullSchema>;

// Re-export base for convenience
export { promoCodeBaseSchema };
