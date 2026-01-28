import { z } from 'zod';
import { promoCodeBaseSchema } from './promo.base';

// Create promo code (admin).

export const createPromoCodeSchema = promoCodeBaseSchema;

export type CreatePromoCodeInput = z.infer<typeof createPromoCodeSchema>;

