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
import type {
  AdminQuestionRow,
  PublicProductQuestionRow,
} from "@/repositories/product_question.repository";
import {
  getAdminQuestions,
  createProductQuestion,
  updateProductQuestion,
  addProductAnswer,
  getLatestAnswerForQuestion,
  deleteProductQuestion,
  getApprovedQuestionsWithAnswersByProductId,
  createProductQuestionForUser,
} from "@/repositories/product_question.repository";

/**
 * Get all product questions for admin (with product name, user name, latest answer).
 */
export async function getAllQuestionsAdmin(): Promise<AdminQuestionRow[]> {
  await requireAdmin();
  return getAdminQuestions();
}

/**
 * Create a product question as admin (optional answer and is_approved).
 * Non-empty answer forces approval and records admin_id on the answer row.
 */
export async function createQuestionAdmin(
  input: unknown,
  adminId?: string | null,
): Promise<AdminQuestionRow | null> {
  try {
    await requireAdmin();
  } catch {
    return null;
  }
  const parsed = createProductQuestionAdminSchema.parse(
    input,
  ) as CreateProductQuestionAdminInput;

  const hasAnswer = Boolean(parsed.answer?.trim());
  return createProductQuestion(
    {
      product_id: parsed.product_id,
      user_id: parsed.user_id ?? null,
      question: parsed.question,
      is_approved: hasAnswer ? true : parsed.is_approved,
    },
    parsed.answer,
    adminId,
  );
}

/**
 * Update a product question (question text, is_approved).
 * Inserts a new answer row only when the text differs from the latest answer.
 * Adding/changing an answer auto-approves the question.
 */
export async function updateQuestionAdmin(
  id: string,
  input: unknown,
  adminId?: string | null,
): Promise<boolean> {
  try {
    await requireAdmin();
  } catch {
    return false;
  }
  const parsed = updateProductQuestionSchema.parse(
    input,
  ) as UpdateProductQuestionInput;

  const willAddAnswer = Boolean(parsed.answer?.trim());
  let answerInserted = false;

  if (willAddAnswer) {
    const nextAnswer = parsed.answer!.trim();
    const latest = await getLatestAnswerForQuestion(id);
    if (!latest || latest.trim() !== nextAnswer) {
      const ok = await addProductAnswer(id, nextAnswer, adminId);
      if (!ok) return false;
      answerInserted = true;
    }
  }

  const ok = await updateProductQuestion(id, {
    question: parsed.question,
    is_approved: answerInserted
      ? true
      : parsed.is_approved,
  });
  return ok;
}

/**
 * Submit an answer to a question (admin).
 * Records admin_id and auto-approves the question.
 */
export async function submitAnswerAdmin(
  input: unknown,
  adminId?: string | null,
): Promise<boolean> {
  try {
    await requireAdmin();
  } catch {
    return false;
  }
  const parsed = submitProductAnswerSchema.parse(
    input,
  ) as SubmitProductAnswerInput;
  const ok = await addProductAnswer(
    parsed.question_id,
    parsed.answer,
    adminId,
  );
  if (!ok) return false;
  return updateProductQuestion(parsed.question_id, { is_approved: true });
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

/**
 * Public PDP: approved questions with latest answers.
 */
export async function getProductQuestionsService(
  productId: string,
): Promise<PublicProductQuestionRow[]> {
  return getApprovedQuestionsWithAnswersByProductId(productId);
}

/**
 * Storefront customer ask (pending until admin answers).
 */
export async function createProductQuestionForUserService(input: {
  product_id: string;
  user_id: string;
  question: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const ok = await createProductQuestionForUser(input);
  if (!ok) {
    return { success: false, error: "Failed to submit question. Please try again." };
  }
  return { success: true };
}
