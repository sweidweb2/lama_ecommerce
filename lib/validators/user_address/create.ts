import { z } from "zod";
import { addressBaseSchema } from "./base";

// Schema for creating a new user address.

export const createAddressSchema = addressBaseSchema.extend({
  user_id: z.string().uuid().nullable().optional(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;

