import { z } from "zod";

/** Schema for admin creating a new user (auth + profile). */
export const createUserSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"]),
  status: z.enum(["active", "inactive"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

