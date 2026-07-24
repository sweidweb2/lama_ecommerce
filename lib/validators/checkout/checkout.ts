import { z } from "zod";
import {
  checkoutPhoneSchema,
  isValidCheckoutPhone,
} from "@/lib/validators/phone";

const CHECKOUT_EMAIL_MESSAGE = "Please enter a valid email address";

export { isValidCheckoutPhone, checkoutPhoneSchema };

export function isValidCheckoutEmail(value: string): boolean {
  return checkoutEmailSchema.safeParse(value.trim()).success;
}

export const checkoutEmailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email(CHECKOUT_EMAIL_MESSAGE);

export const checkoutContactSchema = z.object({
  phone: checkoutPhoneSchema,
  email: checkoutEmailSchema,
});

/**
 * Schema for the checkout form submitted from the cart page.
 * Monetary values are calculated server-side; only the shipping_zone_id
 * is sent so the server can look up the fee.
 */
export const checkoutSchema = z
  .object({
    cart_id: z.string().uuid("Invalid cart ID"),
    shipping_zone_id: z.string().uuid("Please select a shipping zone"),
    address: z.object({
      country: z.string().min(1, "Country is required"),
      city: z.string().min(1, "City is required"),
      address: z.string().min(1, "Address is required"),
      postal_code: z.string().optional().default(""),
    }),
    phone: checkoutPhoneSchema,
    email: checkoutEmailSchema,
    /** When true and user is authenticated, save submitted address to address book after order. */
    save_address: z.boolean().optional(),
    /** create = insert (default); update = edit selected saved address. */
    save_address_mode: z.enum(["create", "update"]).optional().default("create"),
    /** Required when save_address_mode is update. */
    saved_address_id: z.string().uuid().optional(),
    /** Optional promo / coupon code; discount is computed server-side in process_checkout. */
    promo_code: z
      .string()
      .trim()
      .max(50)
      .optional()
      .transform((v) => (v ? v.toUpperCase() : undefined)),
  })
  .refine(
    (data) =>
      !data.save_address ||
      data.save_address_mode !== "update" ||
      Boolean(data.saved_address_id),
    {
      message: "saved_address_id is required when updating an address",
      path: ["saved_address_id"],
    },
  );

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutParsed = z.output<typeof checkoutSchema>;

/** sessionStorage key for last successful checkout order-details path. */
export const PENDING_ORDER_DETAILS_PATH_KEY = "lama_pending_order_details_path";
