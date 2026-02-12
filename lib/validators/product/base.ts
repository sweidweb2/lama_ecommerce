import { z } from "zod";

// Base schema for product input coming from admin forms.
// Maps to the `products` table (excluding server-managed fields).
// This is used both on the client (form validation) and on the server.

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const skuRegex = /^[A-Z0-9-]+$/;

export const productBaseSchema = z.object({
  // Required core fields
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters"),

  // Optional long description - keep reasonably bounded
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .nullable()
    .optional(),

  // Optional slug; when provided, must be URL friendly and a realistic length
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(60, "Slug must be at most 60 characters")
    .regex(
      slugRegex,
      "Slug can only contain lowercase letters, numbers, and single hyphens between segments",
    )
    .nullable()
    .optional(),

  // Optional foreign keys
  brand_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),

  // Optional SKU; enforce realistic length and pattern (e.g. PROD-001)
  sku: z
    .string()
    .min(3, "SKU must be at least 3 characters")
    .max(32, "SKU must be at most 32 characters")
    .regex(
      skuRegex,
      "SKU can only contain uppercase letters, numbers, and hyphens",
    )
    .nullable()
    .optional(),

  // Price must be a positive amount within a sane upper bound
  price: z
    .number()
    .positive("Price must be greater than 0")
    .max(1_000_000, "Price must be less than 1,000,000"),

  // Flags with sensible defaults
  is_featured: z.boolean().optional().default(false),
  is_trending: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
});

export type ProductBaseInput = z.infer<typeof productBaseSchema>;