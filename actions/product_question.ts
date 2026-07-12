"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { CreateProductQuestionAdminInput } from "@/lib/validators/product_question/admin_create";
import type { UpdateProductQuestionInput } from "@/lib/validators/product_question/update";
import {
  getAllQuestionsAdmin,
  createQuestionAdmin,
  updateQuestionAdmin,
  submitAnswerAdmin,
  deleteQuestionAdmin,
} from "@/services/product_question.service";

export async function getAllQuestionsAction() {
  await requireAdmin();
  return getAllQuestionsAdmin();
}

export async function createQuestionAction(input: CreateProductQuestionAdminInput) {
  await requireAdmin();
  const result = await createQuestionAdmin(input);
  if (!result) {
    return { success: false as const, error: "Failed to create question." };
  }
  revalidatePath("/admin/qa");
  return { success: true as const, data: result };
}

export async function updateQuestionAction(id: string, input: UpdateProductQuestionInput) {
  await requireAdmin();
  const ok = await updateQuestionAdmin(id, input);
  if (!ok) {
    return { success: false as const, error: "Failed to update question." };
  }
  revalidatePath("/admin/qa");
  return { success: true as const };
}

export async function submitAnswerAction(questionId: string, answer: string) {
  await requireAdmin();
  const ok = await submitAnswerAdmin({ question_id: questionId, answer });
  if (!ok) {
    return { success: false as const, error: "Failed to submit answer." };
  }
  revalidatePath("/admin/qa");
  return { success: true as const };
}

export async function deleteQuestionAction(id: string) {
  await requireAdmin();
  const ok = await deleteQuestionAdmin(id);
  if (!ok) {
    return { success: false as const, error: "Failed to delete question." };
  }
  revalidatePath("/admin/qa");
  return { success: true as const };
}
