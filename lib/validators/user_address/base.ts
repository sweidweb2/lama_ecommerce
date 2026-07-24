import { z } from "zod";
import { phoneSchema } from "@/lib/validators/phone";

// User address form (shipping / billing).

export const addressBaseSchema = z.object({
  country: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(255),
  postal_code: z.string().max(20).nullable().optional(),
  phone: phoneSchema,
  is_default: z.boolean().optional().default(false),
});

export type AddressBaseInput = z.infer<typeof addressBaseSchema>;
