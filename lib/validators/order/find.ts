import { z } from "zod";

export const findOrderSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address." })
    .transform((value) => value.toLowerCase()),
  shortOrderId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{8}$/, {
      message:
        "Enter the 8-character order code from your confirmation email.",
    })
    .transform((value) => value.toUpperCase()),
});

export type FindOrderInput = z.infer<typeof findOrderSchema>;
