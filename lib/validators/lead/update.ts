import { z } from "zod";

export const updateLeadSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
