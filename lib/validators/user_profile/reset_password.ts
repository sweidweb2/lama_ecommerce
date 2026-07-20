import { z } from "zod";

/** Schema for admin setting a user's password via Auth Admin API. */
export const adminResetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
