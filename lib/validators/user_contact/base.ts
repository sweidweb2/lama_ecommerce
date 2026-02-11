import { z } from "zod";

// Contact-us form submitted from the storefront.

export const contactBaseSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  full_name: z.string().min(1).max(200),
  phone: z.string().min(5).max(30).nullable().optional(),
  email: z.string().email(),
});

export type ContactBaseInput = z.infer<typeof contactBaseSchema>;

