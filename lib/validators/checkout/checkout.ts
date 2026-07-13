import { z } from "zod";

/**
 * Schema for the checkout form submitted from the cart page.
 * Monetary values are calculated server-side; only the shipping_zone_id
 * is sent so the server can look up the fee.
 */
export const checkoutSchema = z.object({
  cart_id: z.string().uuid("Invalid cart ID"),
  shipping_zone_id: z.string().uuid("Please select a shipping zone"),
  address: z.object({
    country: z.string().min(1, "Country is required"),
    city: z.string().min(1, "City is required"),
    address: z.string().min(1, "Address is required"),
    postal_code: z.string().optional().default(""),
  }),
  phone: z.string().min(5, "Phone must be at least 5 characters").max(30),
  email: z.string().email("Please enter a valid email address"),
  /** When true and user is authenticated, save submitted address to address book after order. */
  save_address: z.boolean().optional(),
  /** Optional promo / coupon code; discount is computed server-side in process_checkout. */
  promo_code: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v ? v.toUpperCase() : undefined)),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
