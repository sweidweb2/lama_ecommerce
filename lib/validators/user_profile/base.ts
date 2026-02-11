import { z } from "zod";

// Profile edit form (name + role for admin panels).

export const profileBaseSchema = z.object({
  full_name: z.string().min(1).max(200),
  role: z.enum(["user", "admin"]),
});

export type ProfileBaseInput = z.infer<typeof profileBaseSchema>;

