import { z } from "zod";

export const createLeadSchema = z.object({
  email: z.string().email(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
