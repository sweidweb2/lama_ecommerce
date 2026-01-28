import { z } from 'zod';
import { addressBaseSchema } from './address.base';

// Schema for updating an existing address.

export const updateAddressSchema = addressBaseSchema.partial();

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

