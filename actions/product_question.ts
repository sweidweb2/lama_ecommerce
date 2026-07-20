"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import type { CreateProductQuestionAdminInput } from "@/lib/validators/product_question/admin_create";
import type { UpdateProductQuestionInput } from "@/lib/validators/product_question/update";
import {
  createProductQuestionSchema,
} from "@/lib/validators/product_question/create";
import {
  getAllQuestionsAdmin,
  createQuestionAdmin,
  updateQuestionAdmin,
  submitAnswerAdmin,
  deleteQuestionAdmin,
  createProductQuestionForUserService,
} from "@/services/product_question.service";
import { getAdminShopBlockForCurrentUser } from "@/lib/auth/require-customer-shop";
import {
  checkFormRateLimit,
  getClientIpFromHeaders,
} from "@/lib/rate-limit";

const PRODUCT_QA_RATE_LIMIT = { limit: 10, windowSeconds: 15 * 60 } as const;

export async function getAllQuestionsAction() {
  await requireAdmin();
  return getAllQuestionsAdmin();
}

export async function createQuestionAction(input: CreateProductQuestionAdminInput) {
  const admin = await requireAdmin();
  const result = await createQuestionAdmin(input, admin.user_id);
  if (!result) {
    return { success: false as const, error: "Failed to create question." };
  }
  revalidatePath("/admin/qa");
  return { success: true as const, data: result };
}

export async function updateQuestionAction(id: string, input: UpdateProductQuestionInput) {
  const admin = await requireAdmin();
  const ok = await updateQuestionAdmin(id, input, admin.user_id);
  if (!ok) {
    return { success: false as const, error: "Failed to update question." };
  }
  revalidatePath("/admin/qa");
  return { success: true as const };
}

export async function submitAnswerAction(questionId: string, answer: string) {
  const admin = await requireAdmin();
  const ok = await submitAnswerAdmin(
    { question_id: questionId, answer },
    admin.user_id,
  );
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

/**
 * Storefront: authenticated customer asks a product question (pending until admin answers).
 */
export async function createProductQuestionAction(input: {
  product_id: string;
  question: string;
  product_slug?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const shopBlock = await getAdminShopBlockForCurrentUser();
  if (shopBlock) {
    return { success: false, error: shopBlock };
  }

  const user = await getCurrentAuthUserFromAction();
  if (!user) {
    return {
      success: false,
      error: "You must be signed in to ask a question",
    };
  }

  const parsed = createProductQuestionSchema.safeParse({
    product_id: input.product_id,
    question: input.question,
    user_id: user.id,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    return { success: false, error: first || "Invalid question" };
  }

  const ip = await getClientIpFromHeaders();
  const allowed = await checkFormRateLimit({
    key: `product-qa:${user.id}:${ip}`,
    limit: PRODUCT_QA_RATE_LIMIT.limit,
    windowSeconds: PRODUCT_QA_RATE_LIMIT.windowSeconds,
  });
  if (!allowed) {
    return {
      success: false,
      error: "Too many questions. Try again later.",
    };
  }

  const result = await createProductQuestionForUserService({
    product_id: parsed.data.product_id,
    user_id: user.id,
    question: parsed.data.question,
  });
  if (!result.success) {
    return { success: false, error: result.error };
  }

  if (input.product_slug) {
    revalidatePath(`/products/${input.product_slug}`);
  }
  revalidatePath("/products");
  revalidatePath("/admin/qa");
  return { success: true };
}
