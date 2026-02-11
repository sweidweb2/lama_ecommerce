import { z } from "zod";

// User address form (shipping / billing).

export const addressBaseSchema = z.object({
  country: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  address: z.string().min(1).max(255),
  postal_code: z.string().max(20).nullable().optional(),
  phone: z.string().min(5).max(30),
  is_default: z.boolean().optional().default(false),
});

export type AddressBaseInput = z.infer<typeof addressBaseSchema>;

