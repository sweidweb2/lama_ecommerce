import { z } from "zod";
import { categoryBaseSchema } from "./base";

// Schema for updating an existing category (admin).
// All fields optional; ID is handled separately in routes/actions.

export const updateCategorySchema = categoryBaseSchema.partial();

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

