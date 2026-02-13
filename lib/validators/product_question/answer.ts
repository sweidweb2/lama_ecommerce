import { z } from "zod";

/** Submit an answer to a product question (admin). */
export const submitProductAnswerSchema = z.object({
  question_id: z.string().uuid(),
  answer: z.string().min(1).max(2000),
});

export type SubmitProductAnswerInput = z.infer<typeof submitProductAnswerSchema>;
