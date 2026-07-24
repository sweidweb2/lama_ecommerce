import { z } from "zod";

// Customer self-edit on /account (full_name only).

export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(200),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
