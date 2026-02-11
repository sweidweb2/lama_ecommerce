import { z } from "zod";
import { promoCodeBaseSchema } from "./base";

// Update promo code (admin) – partial fields.
export const updatePromoCodeSchema = promoCodeBaseSchema.partial();

export type UpdatePromoCodeInput = z.infer<typeof updatePromoCodeSchema>;

// Full update payload (e.g. from edit form) – id + all fields.
export const updatePromoCodeFullSchema = z
  .object({ id: z.string().uuid() })
  .merge(promoCodeBaseSchema);

export type UpdatePromoCodeFullInput = z.infer<typeof updatePromoCodeFullSchema>;

