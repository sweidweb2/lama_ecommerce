import { z } from "zod";
import { profileBaseSchema } from "./base";

// Admin-created profiles (if you ever add manual user creation).

export const createProfileSchema = profileBaseSchema.extend({
  user_id: z.string().uuid(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;

