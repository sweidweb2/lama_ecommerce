import { z } from "zod";
import { profileBaseSchema } from "./base";

// User profile update (from account settings).

export const updateProfileSchema = profileBaseSchema.partial();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

