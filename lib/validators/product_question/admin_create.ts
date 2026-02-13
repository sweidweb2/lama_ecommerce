import { z } from "zod";
import { createProductQuestionSchema } from "./create";

/** Admin create: question + optional answer + optional approval. */
export const createProductQuestionAdminSchema = createProductQuestionSchema.extend({
  answer: z.string().max(2000).optional().nullable().transform((v) => (v && v.trim()) || null),
  is_approved: z.boolean().optional(),
});

export type CreateProductQuestionAdminInput = z.infer<
  typeof createProductQuestionAdminSchema
>;
