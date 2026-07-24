import { z } from "zod";

export const PHONE_MESSAGE = "Enter a valid phone number";

/**
 * International-friendly phone: optional leading +, 8–15 digits.
 * Allows spaces, dashes, and parentheses for formatting.
 */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!/^\+?[\d\s\-()]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/** Alias kept for checkout call sites / docs that use the checkout-prefixed name. */
export const isValidCheckoutPhone = isValidPhone;

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine(isValidPhone, { message: PHONE_MESSAGE });

/** Alias kept for checkout schemas. */
export const checkoutPhoneSchema = phoneSchema;
