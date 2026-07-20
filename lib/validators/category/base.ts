import { z } from "zod";

// Base schema for category input coming from admin forms.
// Maps to the `categories` table (excluding server-managed fields).

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categoryBaseSchema = z.object({
  name: z.string().min(1).max(40),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(20, "Slug must be at most 20 characters")
    .regex(
      slugRegex,
      "Slug can only contain lowercase letters, numbers, and single hyphens between segments",
    ),
  parent_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional().default(true),
});

export type CategoryBaseInput = z.infer<typeof categoryBaseSchema>;
