import { z } from "zod";

// Base schema for category input coming from admin forms.
// Maps to the `categories` table (excluding server-managed fields).

export const categoryBaseSchema = z.object({
  name: z.string().min(1).max(40),
  slug: z.string().min(1).max(20).nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional().default(true),
});

export type CategoryBaseInput = z.infer<typeof categoryBaseSchema>;

