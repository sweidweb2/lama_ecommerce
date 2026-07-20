import { z } from "zod";
import { brandBaseSchema } from "./base";

// Schema for creating a new brand (admin).

export const createBrandSchema = brandBaseSchema;

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
