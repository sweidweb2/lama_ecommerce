import { z } from "zod";
import { brandBaseSchema } from "./base";

// Schema for updating an existing brand (admin).
// Name remains required (same as create / admin forms).
// ID is handled separately in routes/actions.

export const updateBrandSchema = brandBaseSchema;

export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
