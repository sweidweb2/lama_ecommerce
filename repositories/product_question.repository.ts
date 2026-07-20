import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

/** Admin list item: question with product name, user name, and latest answer text. */
export interface AdminQuestionRow {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string | null;
  user_name: string | null;
  question: string;
  answer: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface CreateProductQuestionRepoInput {
  product_id: string;
  user_id: string | null;
  question: string;
  is_approved?: boolean;
}

export interface UpdateProductQuestionRepoInput {
  question?: string;
  is_approved?: boolean;
}

/**
 * Fetch all product questions for admin with product name, user name, and latest answer.
 */
export async function getAdminQuestions(): Promise<AdminQuestionRow[]> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: questions, error: qError } = await (supabase as any)
      .from("product_questions")
      .select("id, product_id, user_id, question, is_approved, created_at")
      .order("created_at", { ascending: false });

    if (qError || !questions?.length) {
      if (qError) console.error("Failed to fetch product_questions:", qError);
      return [];
    }

    const productIds = [...new Set(questions.map((q: any) => q.product_id))];
    const userIds = [...new Set(questions.map((q: any) => q.user_id).filter(Boolean))];

    const [{ data: products }, { data: profiles }, { data: answers }] = await Promise.all([
      productIds.length
        ? (supabase as any).from("products").select("id, name").in("id", productIds)
        : { data: [] },
      userIds.length
        ? (supabase as any).from("profiles").select("user_id, full_name").in("user_id", userIds)
        : { data: [] },
      (supabase as any)
        .from("product_answers")
        .select("product_question_id, answer")
        .in("product_question_id", questions.map((q: any) => q.id))
        .order("created_at", { ascending: false }),
    ]);

    const productMap = new Map<string, string>();
    (products ?? []).forEach((p: { id: string; name: string }) => productMap.set(p.id, p.name));
    const profileMap = new Map<string, string>();
    (profiles ?? []).forEach((p: { user_id: string; full_name: string | null }) =>
      profileMap.set(p.user_id, p.full_name ?? "Unknown")
    );
    const latestAnswerByQuestion = new Map<string, string>();
    (answers ?? []).forEach((a: { product_question_id: string; answer: string }) => {
      if (!latestAnswerByQuestion.has(a.product_question_id)) {
        latestAnswerByQuestion.set(a.product_question_id, a.answer);
      }
    });

    return questions.map((q: any) => ({
      id: q.id,
      product_id: q.product_id,
      product_name: productMap.get(q.product_id) ?? "Unknown",
      user_id: q.user_id,
      user_name: q.user_id ? profileMap.get(q.user_id) ?? null : null,
      question: q.question,
      answer: latestAnswerByQuestion.get(q.id) ?? null,
      is_approved: q.is_approved ?? false,
      created_at: q.created_at,
    }));
  } catch (err) {
    console.error("Unexpected error in getAdminQuestions:", err);
    return [];
  }
}

/**
 * Create a product question (admin). Optionally create an answer in the same flow.
 */
export async function createProductQuestion(
  input: CreateProductQuestionRepoInput,
  answerText?: string | null,
  adminId?: string | null
): Promise<AdminQuestionRow | null> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: question, error: qError } = await (supabase as any)
      .from("product_questions")
      .insert({
        product_id: input.product_id,
        user_id: input.user_id || null,
        question: input.question,
        is_approved: input.is_approved ?? false,
      })
      .select("id, product_id, user_id, question, is_approved, created_at")
      .single();

    if (qError || !question) {
      console.error("Failed to create product_question:", qError);
      return null;
    }

    if (answerText?.trim() && question.id) {
      await (supabase as any).from("product_answers").insert({
        product_question_id: question.id,
        admin_id: adminId || null,
        answer: answerText.trim(),
      });
    }

    const { data: productData } = await (supabase as any)
      .from("products")
      .select("name")
      .eq("id", question.product_id)
      .single();
    const productName = productData?.name ?? "Unknown";
    let userName: string | null = null;
    if (question.user_id) {
      const { data: profileData } = await (supabase as any)
        .from("profiles")
        .select("full_name")
        .eq("user_id", question.user_id)
        .maybeSingle();
      userName = profileData?.full_name ?? null;
    }

    return {
      id: question.id,
      product_id: question.product_id,
      product_name: productName,
      user_id: question.user_id,
      user_name: userName,
      question: question.question,
      answer: answerText?.trim() || null,
      is_approved: question.is_approved,
      created_at: question.created_at,
    };
  } catch (err) {
    console.error("Unexpected error in createProductQuestion:", err);
    return null;
  }
}

/**
 * Update a product question (question text, is_approved).
 */
export async function updateProductQuestion(
  id: string,
  input: UpdateProductQuestionRepoInput
): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
    const updateData: Record<string, unknown> = {};
    if (input.question !== undefined) updateData.question = input.question;
    if (input.is_approved !== undefined) updateData.is_approved = input.is_approved;

    if (Object.keys(updateData).length === 0) return true;

    const { error } = await (supabase as any)
      .from("product_questions")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Failed to update product_question:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error in updateProductQuestion:", err);
    return false;
  }
}

/**
 * Latest answer text for a question, or null if none.
 */
export async function getLatestAnswerForQuestion(
  productQuestionId: string,
): Promise<string | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("product_answers")
      .select("answer")
      .eq("product_question_id", productQuestionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch latest product_answer:", error);
      return null;
    }

    return (data?.answer as string | undefined) ?? null;
  } catch (err) {
    console.error("Unexpected error in getLatestAnswerForQuestion:", err);
    return null;
  }
}

/**
 * Add an answer to a question (inserts new row; display uses latest).
 */
export async function addProductAnswer(
  productQuestionId: string,
  answer: string,
  adminId?: string | null
): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await (supabase as any)
      .from("product_answers")
      .insert({
        product_question_id: productQuestionId,
        admin_id: adminId || null,
        answer: answer.trim(),
      });

    if (error) {
      console.error("Failed to create product_answer:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error in addProductAnswer:", err);
    return false;
  }
}

/**
 * Delete a product question (cascade deletes answers).
 */
export async function deleteProductQuestion(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await (supabase as any)
      .from("product_questions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete product_question:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error in deleteProductQuestion:", err);
    return false;
  }
}

/** Public PDP row: approved question with latest answer text. */
export interface PublicProductQuestionRow {
  id: string;
  product_id: string;
  question: string;
  answer: string | null;
  created_at: string;
}

/**
 * Approved questions for a product with latest answer (storefront).
 * Uses service-role read filtered to is_approved so guests can see Q&A
 * even before client RLS is applied; policies still protect session clients.
 */
export async function getApprovedQuestionsWithAnswersByProductId(
  productId: string,
): Promise<PublicProductQuestionRow[]> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: questions, error: qError } = await (supabase as any)
      .from("product_questions")
      .select("id, product_id, question, created_at")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (qError) {
      console.error("Failed to fetch approved product_questions:", qError);
      return [];
    }
    if (!questions?.length) return [];

    const { data: answers, error: aError } = await (supabase as any)
      .from("product_answers")
      .select("product_question_id, answer, created_at")
      .in(
        "product_question_id",
        questions.map((q: { id: string }) => q.id),
      )
      .order("created_at", { ascending: false });

    if (aError) {
      console.error("Failed to fetch product_answers for PDP:", aError);
    }

    const latestAnswerByQuestion = new Map<string, string>();
    (answers ?? []).forEach(
      (a: { product_question_id: string; answer: string }) => {
        if (!latestAnswerByQuestion.has(a.product_question_id)) {
          latestAnswerByQuestion.set(a.product_question_id, a.answer);
        }
      },
    );

    return questions.map((q: any) => ({
      id: q.id,
      product_id: q.product_id,
      question: q.question,
      answer: latestAnswerByQuestion.get(q.id) ?? null,
      created_at: q.created_at,
    }));
  } catch (err) {
    console.error(
      "Unexpected error in getApprovedQuestionsWithAnswersByProductId:",
      err,
    );
    return [];
  }
}

/**
 * Customer storefront ask — pending (is_approved false) via user session client.
 */
export async function createProductQuestionForUser(input: {
  product_id: string;
  user_id: string;
  question: string;
}): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { error } = await (supabase as any).from("product_questions").insert({
      product_id: input.product_id,
      user_id: input.user_id,
      question: input.question.trim(),
      is_approved: false,
    });

    if (error) {
      console.error("Failed to create product_question for user:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error in createProductQuestionForUser:", err);
    return false;
  }
}
