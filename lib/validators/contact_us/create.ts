import { z } from "zod";

/** Single source for Zod `.max()` and form `maxLength`. */
export const CONTACT_US_FIELD_MAX = {
  full_name: 200,
  subject: 200,
  message: 5000,
  phone: 30,
  email: 254,
} as const;

export const createContactUsSchema = z.object({
  full_name: z
    .string()
    .min(1, "Name is required")
    .max(
      CONTACT_US_FIELD_MAX.full_name,
      `Name must be at most ${CONTACT_US_FIELD_MAX.full_name} characters`,
    ),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(
      CONTACT_US_FIELD_MAX.email,
      `Email must be at most ${CONTACT_US_FIELD_MAX.email} characters`,
    ),
  message: z
    .string()
    .min(1, "Message is required")
    .max(
      CONTACT_US_FIELD_MAX.message,
      `Message must be at most ${CONTACT_US_FIELD_MAX.message} characters`,
    ),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(
      CONTACT_US_FIELD_MAX.subject,
      `Subject must be at most ${CONTACT_US_FIELD_MAX.subject} characters`,
    ),
  phone: z
    .string()
    .max(
      CONTACT_US_FIELD_MAX.phone,
      `Phone must be at most ${CONTACT_US_FIELD_MAX.phone} characters`,
    )
    .optional()
    .nullable()
    .transform((v) => (v && v.trim()) || null),
});

export type CreateContactUsInput = z.infer<typeof createContactUsSchema>;

export type ContactUsFieldKey = keyof typeof CONTACT_US_FIELD_MAX;
