import { z } from "zod";

export const createLeadSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((e) => e.toLowerCase()),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
