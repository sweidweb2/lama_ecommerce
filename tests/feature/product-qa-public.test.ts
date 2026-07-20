import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_CANNOT_SHOP_MESSAGE } from "@/lib/auth/permissions";
import { adminProfile, userProfile } from "../helpers/mocks";

const getCurrentUserProfile = vi.fn();
const getCurrentAuthUserFromAction = vi.fn();
const requireAdmin = vi.fn();
const addProductAnswer = vi.fn();
const updateProductQuestion = vi.fn();
const getLatestAnswerForQuestion = vi.fn();
const createProductQuestion = vi.fn();
const createProductQuestionForUser = vi.fn();
const getApprovedQuestionsWithAnswersByProductId = vi.fn();
const getAdminShopBlockForCurrentUser = vi.fn();
const checkFormRateLimit = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/services/profile.service", () => ({
  getCurrentUserProfile: (...args: unknown[]) => getCurrentUserProfile(...args),
  getAdminShopBlockForUserId: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/lib/auth/require-customer-shop", () => ({
  getAdminShopBlockForCurrentUser: (...args: unknown[]) =>
    getAdminShopBlockForCurrentUser(...args),
}));

vi.mock("@/repositories/auth.repository", () => ({
  getCurrentAuthUserFromAction: (...args: unknown[]) =>
    getCurrentAuthUserFromAction(...args),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkFormRateLimit: (...args: unknown[]) => checkFormRateLimit(...args),
  getClientIpFromHeaders: vi.fn().mockResolvedValue("1.1.1.1"),
  CONTACT_RATE_LIMIT: { limit: 5, windowSeconds: 900 },
}));

vi.mock("@/repositories/product_question.repository", () => ({
  getAdminQuestions: vi.fn(),
  createProductQuestion: (...args: unknown[]) => createProductQuestion(...args),
  updateProductQuestion: (...args: unknown[]) => updateProductQuestion(...args),
  addProductAnswer: (...args: unknown[]) => addProductAnswer(...args),
  getLatestAnswerForQuestion: (...args: unknown[]) =>
    getLatestAnswerForQuestion(...args),
  deleteProductQuestion: vi.fn(),
  getApprovedQuestionsWithAnswersByProductId: (...args: unknown[]) =>
    getApprovedQuestionsWithAnswersByProductId(...args),
  createProductQuestionForUser: (...args: unknown[]) =>
    createProductQuestionForUser(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

describe("submitAnswerAdmin auto-approve + admin_id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    requireAdmin.mockResolvedValue(adminProfile);
    addProductAnswer.mockResolvedValue(true);
    updateProductQuestion.mockResolvedValue(true);
  });

  it("records admin_id and sets is_approved true", async () => {
    const { submitAnswerAdmin } = await import(
      "@/services/product_question.service"
    );
    const ok = await submitAnswerAdmin(
      {
        question_id: "00000000-0000-4000-8000-000000000001",
        answer: "Here is the answer",
      },
      "user-admin",
    );
    expect(ok).toBe(true);
    expect(addProductAnswer).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      "Here is the answer",
      "user-admin",
    );
    expect(updateProductQuestion).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      { is_approved: true },
    );
  });

  it("submitAnswerAction passes requireAdmin user_id", async () => {
    const { submitAnswerAction } = await import("@/actions/product_question");
    const result = await submitAnswerAction(
      "00000000-0000-4000-8000-000000000001",
      "Answer text",
    );
    expect(result).toEqual({ success: true });
    expect(requireAdmin).toHaveBeenCalled();
    expect(addProductAnswer).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      "Answer text",
      "user-admin",
    );
  });
});

describe("createProductQuestionAction storefront", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminShopBlockForCurrentUser.mockResolvedValue(null);
    getCurrentAuthUserFromAction.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000099",
    });
    checkFormRateLimit.mockResolvedValue(true);
    createProductQuestionForUser.mockResolvedValue(true);
  });

  it("rejects unauthenticated callers", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue(null);
    const { createProductQuestionAction } = await import(
      "@/actions/product_question"
    );
    const result = await createProductQuestionAction({
      product_id: "00000000-0000-4000-8000-000000000010",
      question: "What size?",
    });
    expect(result.success).toBe(false);
    expect(createProductQuestionForUser).not.toHaveBeenCalled();
  });

  it("rejects admin shoppers", async () => {
    getAdminShopBlockForCurrentUser.mockResolvedValue(ADMIN_CANNOT_SHOP_MESSAGE);
    const { createProductQuestionAction } = await import(
      "@/actions/product_question"
    );
    const result = await createProductQuestionAction({
      product_id: "00000000-0000-4000-8000-000000000010",
      question: "What size?",
    });
    expect(result).toEqual({
      success: false,
      error: ADMIN_CANNOT_SHOP_MESSAGE,
    });
    expect(createProductQuestionForUser).not.toHaveBeenCalled();
  });

  it("inserts pending question for customer", async () => {
    const { createProductQuestionAction } = await import(
      "@/actions/product_question"
    );
    const result = await createProductQuestionAction({
      product_id: "00000000-0000-4000-8000-000000000010",
      question: "What size?",
      product_slug: "tee",
    });
    expect(result).toEqual({ success: true });
    expect(createProductQuestionForUser).toHaveBeenCalledWith({
      product_id: "00000000-0000-4000-8000-000000000010",
      user_id: "00000000-0000-4000-8000-000000000099",
      question: "What size?",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/products/tee");
  });
});

describe("getProductQuestionsService", () => {
  it("returns only approved rows from repo", async () => {
    getApprovedQuestionsWithAnswersByProductId.mockResolvedValue([
      {
        id: "q1",
        product_id: "p1",
        question: "Q?",
        answer: "A",
        created_at: "2026-01-01",
      },
    ]);
    const { getProductQuestionsService } = await import(
      "@/services/product_question.service"
    );
    const rows = await getProductQuestionsService("p1");
    expect(rows).toHaveLength(1);
    expect(getApprovedQuestionsWithAnswersByProductId).toHaveBeenCalledWith(
      "p1",
    );
  });
});
