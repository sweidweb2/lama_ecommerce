"use server";

import { revalidatePath } from "next/cache";
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
  return getAllQuestionsAdmin();
}

export async function createQuestionAction(input: CreateProductQuestionAdminInput) {
  const result = await createQuestionAdmin(input);
  if (!result) {
    return { success: false as const, error: "Failed to create question." };
  }
  revalidatePath("/admin/qa");
  return { success: true as const, data: result };
}

export async function updateQuestionAction(id: string, input: UpdateProductQuestionInput) {
  const ok = await updateQuestionAdmin(id, input);
  if (!ok) {
    return { success: false as const, error: "Failed to update question." };
  }
  revalidatePath("/admin/qa");
  return { success: true as const };
}

export async function submitAnswerAction(questionId: string, answer: string) {
  const ok = await submitAnswerAdmin({ question_id: questionId, answer });
  if (!ok) {
    return { success: false as const, error: "Failed to submit answer." };
  }
  revalidatePath("/admin/qa");
  return { success: true as const };
}

export async function deleteQuestionAction(id: string) {
  const ok = await deleteQuestionAdmin(id);
  if (!ok) {
    return { success: false as const, error: "Failed to delete question." };
  }
  revalidatePath("/admin/qa");
  return { success: true as const };
}
