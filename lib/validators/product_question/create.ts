import { z } from "zod";
import { productQuestionBaseSchema } from "./base";

// Create product question.

export const createProductQuestionSchema = productQuestionBaseSchema.extend({
  user_id: z.string().uuid().nullable().optional(),
});

export type CreateProductQuestionInput = z.infer<
  typeof createProductQuestionSchema
>;

