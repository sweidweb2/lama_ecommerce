import { z } from "zod";
import { productQuestionBaseSchema } from "./base";

// Update question (e.g. editing before approval).

export const updateProductQuestionSchema =
  productQuestionBaseSchema.partial();

export type UpdateProductQuestionInput = z.infer<
  typeof updateProductQuestionSchema
>;

