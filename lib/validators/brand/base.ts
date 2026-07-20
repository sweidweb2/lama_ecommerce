import { z } from "zod";

// Base schema for brand input coming from admin forms.
// Maps to the `brands` table (excluding server-managed fields and logo upload).

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const brandBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  slug: z
    .string()
    .min(1)
    .max(50, "Slug must be at most 50 characters")
    .regex(
      slugRegex,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    )
    .nullable()
    .optional(),
});

export type BrandBaseInput = z.infer<typeof brandBaseSchema>;
