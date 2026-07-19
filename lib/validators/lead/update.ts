import { z } from "zod";

export const updateLeadSchema = z.object({
  id: z.string().uuid(),
  email: z
    .string()
    .trim()
    .email()
    .transform((e) => e.toLowerCase()),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
