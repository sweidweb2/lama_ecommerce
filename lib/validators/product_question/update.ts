import { z } from "zod";
import { productQuestionBaseSchema } from "./base";

// Update question (e.g. editing before approval) and optional answer/approval.

export const updateProductQuestionSchema = productQuestionBaseSchema
  .partial()
  .extend({
    is_approved: z.boolean().optional(),
    answer: z
      .string()
      .max(2000)
      .optional()
      .nullable()
      .transform((v) => (v && v.trim()) || null),
  });

export type UpdateProductQuestionInput = z.infer<
  typeof updateProductQuestionSchema
>;

