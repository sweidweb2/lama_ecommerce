import { z } from "zod";
import { categoryBaseSchema } from "./base";

// Schema for creating a new category (admin).

export const createCategorySchema = categoryBaseSchema;

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

