import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createProductQuestionAdminSchema,
  type CreateProductQuestionAdminInput,
} from "@/lib/validators/product_question/admin_create";
import {
  updateProductQuestionSchema,
  type UpdateProductQuestionInput,
} from "@/lib/validators/product_question/update";
import {
  submitProductAnswerSchema,
  type SubmitProductAnswerInput,
} from "@/lib/validators/product_question/answer";
import type { AdminQuestionRow } from "@/repositories/product_question.repository";
import {
  getAdminQuestions,
  createProductQuestion,
  updateProductQuestion,
  addProductAnswer,
  deleteProductQuestion,
} from "@/repositories/product_question.repository";

/**
 * Get all product questions for admin (with product name, user name, latest answer).
 */
export async function getAllQuestionsAdmin(): Promise<AdminQuestionRow[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getAdminQuestions();
}

/**
 * Create a product question as admin (optional answer and is_approved).
 */
export async function createQuestionAdmin(
  input: unknown,
  adminId?: string | null
): Promise<AdminQuestionRow | null> {
  try {
    await requireAdmin();
  } catch {
    return null;
  }
  const parsed = createProductQuestionAdminSchema.parse(input) as CreateProductQuestionAdminInput;
  return createProductQuestion(
    {
      product_id: parsed.product_id,
      user_id: parsed.user_id ?? null,
      question: parsed.question,
      is_approved: parsed.is_approved,
    },
    parsed.answer,
    adminId
  );
}

/**
 * Update a product question (question text, is_approved). If answer is provided, adds a new answer row.
 */
export async function updateQuestionAdmin(
  id: string,
  input: unknown,
  adminId?: string | null
): Promise<boolean> {
  try {
    await requireAdmin();
  } catch {
    return false;
  }
  const parsed = updateProductQuestionSchema.parse(input) as UpdateProductQuestionInput;
  const ok = await updateProductQuestion(id, {
    question: parsed.question,
    is_approved: parsed.is_approved,
  });
  if (!ok) return false;
  if (parsed.answer) {
    await addProductAnswer(id, parsed.answer, adminId);
  }
  return true;
}

/**
 * Submit an answer to a question (admin).
 */
export async function submitAnswerAdmin(
  input: unknown,
  adminId?: string | null
): Promise<boolean> {
  try {
    await requireAdmin();
  } catch {
    return false;
  }
  const parsed = submitProductAnswerSchema.parse(input) as SubmitProductAnswerInput;
  return addProductAnswer(parsed.question_id, parsed.answer, adminId);
}

/**
 * Delete a product question (cascade deletes answers).
 */
export async function deleteQuestionAdmin(id: string): Promise<boolean> {
  try {
    await requireAdmin();
  } catch {
    return false;
  }
  return deleteProductQuestion(id);
}
