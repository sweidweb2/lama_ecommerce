import { z } from "zod";

// User-submitted product question.

export const productQuestionBaseSchema = z.object({
  product_id: z.string().uuid(),
  question: z.string().min(1).max(2000),
});

export type ProductQuestionBaseInput = z.infer<typeof productQuestionBaseSchema>;

