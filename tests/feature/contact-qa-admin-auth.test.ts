import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../helpers/mocks";

const getCurrentUserProfile = vi.fn();
const getAllContactMessages = vi.fn();
const updateContactMessage = vi.fn();
const deleteContactMessage = vi.fn();
const getAdminQuestions = vi.fn();
const createProductQuestion = vi.fn();
const updateProductQuestion = vi.fn();
const addProductAnswer = vi.fn();
const getLatestAnswerForQuestion = vi.fn();
const deleteProductQuestion = vi.fn();

vi.mock("@/services/profile.service", () => ({
  getCurrentUserProfile: (...args: unknown[]) => getCurrentUserProfile(...args),
}));

vi.mock("@/repositories/contact.repository", () => ({
  createContactMessage: vi.fn(),
  getAllContactMessages: (...args: unknown[]) => getAllContactMessages(...args),
  getContactMessageById: vi.fn(),
  updateContactMessage: (...args: unknown[]) => updateContactMessage(...args),
  updateContactMessageStatus: vi.fn(),
  deleteContactMessage: (...args: unknown[]) => deleteContactMessage(...args),
}));

vi.mock("@/repositories/product_question.repository", () => ({
  getAdminQuestions: (...args: unknown[]) => getAdminQuestions(...args),
  createProductQuestion: (...args: unknown[]) => createProductQuestion(...args),
  updateProductQuestion: (...args: unknown[]) => updateProductQuestion(...args),
  addProductAnswer: (...args: unknown[]) => addProductAnswer(...args),
  getLatestAnswerForQuestion: (...args: unknown[]) =>
    getLatestAnswerForQuestion(...args),
  deleteProductQuestion: (...args: unknown[]) => deleteProductQuestion(...args),
  getApprovedQuestionsWithAnswersByProductId: vi.fn(),
  createProductQuestionForUser: vi.fn(),
}));

describe("contact_us.service admin gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAllContactUs throws for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { getAllContactUs } = await import("@/services/contact_us.service");
    await expect(getAllContactUs()).rejects.toThrow("Unauthorized");
    expect(getAllContactMessages).not.toHaveBeenCalled();
  });

  it("update/delete throw for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { updateContactUs, deleteContactUs } = await import(
      "@/services/contact_us.service"
    );
    await expect(
      updateContactUs("1", {
        full_name: "A",
        email: "a@b.com",
        message: "hi",
      }),
    ).rejects.toThrow("Unauthorized");
    await expect(deleteContactUs("1")).rejects.toThrow("Unauthorized");
  });

  it("updateContactUs returns Result failure for invalid input without throwing", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    const { updateContactUs } = await import("@/services/contact_us.service");
    const result = await updateContactUs("1", {
      full_name: "A",
      email: "a@b.com",
      message: "hi",
      // subject missing — Zod required
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
      expect(result.fieldErrors?.subject).toBeTruthy();
    }
    expect(updateContactMessage).not.toHaveBeenCalled();
  });

  it("getAllContactUs reaches repo for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    getAllContactMessages.mockResolvedValue([{ id: "c1" }]);
    const { getAllContactUs } = await import("@/services/contact_us.service");
    await expect(getAllContactUs()).resolves.toEqual([{ id: "c1" }]);
  });
});

describe("product_question.service admin gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAllQuestionsAdmin throws for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { getAllQuestionsAdmin } = await import(
      "@/services/product_question.service"
    );
    await expect(getAllQuestionsAdmin()).rejects.toThrow("Unauthorized");
    expect(getAdminQuestions).not.toHaveBeenCalled();
  });

  it("create/delete return null/false for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { createQuestionAdmin, deleteQuestionAdmin } = await import(
      "@/services/product_question.service"
    );
    await expect(
      createQuestionAdmin({
        product_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        question: "Q?",
        is_approved: false,
      }),
    ).resolves.toBeNull();
    await expect(deleteQuestionAdmin("1")).resolves.toBe(false);
    expect(createProductQuestion).not.toHaveBeenCalled();
    expect(deleteProductQuestion).not.toHaveBeenCalled();
  });

  it("getAllQuestionsAdmin reaches repo for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    getAdminQuestions.mockResolvedValue([{ id: "q1" }]);
    const { getAllQuestionsAdmin } = await import(
      "@/services/product_question.service"
    );
    await expect(getAllQuestionsAdmin()).resolves.toEqual([{ id: "q1" }]);
  });

  it("updateQuestionAdmin skips insert when answer unchanged", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    updateProductQuestion.mockResolvedValue(true);
    getLatestAnswerForQuestion.mockResolvedValue("Same answer");
    const { updateQuestionAdmin } = await import(
      "@/services/product_question.service"
    );
    await expect(
      updateQuestionAdmin("q1", {
        question: "Q?",
        answer: "Same answer",
        is_approved: true,
      }),
    ).resolves.toBe(true);
    expect(addProductAnswer).not.toHaveBeenCalled();
  });

  it("updateQuestionAdmin inserts when answer changed", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    updateProductQuestion.mockResolvedValue(true);
    getLatestAnswerForQuestion.mockResolvedValue("Old answer");
    addProductAnswer.mockResolvedValue(true);
    const { updateQuestionAdmin } = await import(
      "@/services/product_question.service"
    );
    await expect(
      updateQuestionAdmin("q1", {
        question: "Q?",
        answer: "New answer",
        is_approved: true,
      }),
    ).resolves.toBe(true);
    expect(addProductAnswer).toHaveBeenCalledWith("q1", "New answer", undefined);
    expect(updateProductQuestion).toHaveBeenCalledWith("q1", {
      question: "Q?",
      is_approved: true,
    });
  });
});
