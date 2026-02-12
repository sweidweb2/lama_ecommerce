import { z } from "zod";

// Profile edit form (name + role for admin panels).

export const profileBaseSchema = z.object({
  full_name: z.string().min(1).max(200),
  role: z.enum(["user", "admin"]),
});

export const profileAdminUpdateSchema = profileBaseSchema.extend({
  full_name: z.string().min(1).max(200).optional(),
  role: z.enum(["user", "admin"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type ProfileBaseInput = z.infer<typeof profileBaseSchema>;
export type ProfileAdminUpdateInput = z.infer<typeof profileAdminUpdateSchema>;
