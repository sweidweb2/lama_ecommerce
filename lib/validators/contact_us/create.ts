import { z } from "zod";

export const createContactUsSchema = z.object({
  full_name: z.string().min(1).max(40),
  email: z.string().email(),
  message: z.string().min(1).max(400),
  subject: z.string().min(1).max(100),
  phone: z
    .string()
    .max(20)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim()) || null),
});

export type CreateContactUsInput = z.infer<typeof createContactUsSchema>;
