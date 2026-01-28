import { z } from 'zod';
import { promoCodeBaseSchema } from './promo.base';

// Update promo code (admin).

export const updatePromoCodeSchema = promoCodeBaseSchema.partial();

export type UpdatePromoCodeInput = z.infer<typeof updatePromoCodeSchema>;

