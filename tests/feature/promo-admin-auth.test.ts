import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../helpers/mocks";

const getCurrentUserProfile = vi.fn();
const getAllPromoCodes = vi.fn();
const createPromoCode = vi.fn();
const updatePromoCode = vi.fn();
const deletePromoCodeById = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/services/profile.service", () => ({
  getCurrentUserProfile: (...args: unknown[]) => getCurrentUserProfile(...args),
}));

vi.mock("@/repositories/promo_code.repository", () => ({
  getAllPromoCodes: (...args: unknown[]) => getAllPromoCodes(...args),
  createPromoCode: (...args: unknown[]) => createPromoCode(...args),
  updatePromoCode: (...args: unknown[]) => updatePromoCode(...args),
  deletePromoCodeById: (...args: unknown[]) => deletePromoCodeById(...args),
}));

const validPayload = {
  code: "SAVE10",
  discount_type: "percentage" as const,
  discount_value: 10,
  expires_at: null,
  max_uses: null,
  is_active: true,
};

describe("promo actions admin gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPromoCodesAction returns [] for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { getPromoCodesAction } = await import("@/actions/promo");
    await expect(getPromoCodesAction()).resolves.toEqual([]);
    expect(getAllPromoCodes).not.toHaveBeenCalled();
  });

  it("create/update/delete fail without hitting the repo for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const {
      createPromoCodeAction,
      updatePromoCodeAction,
      deletePromoCodeAction,
    } = await import("@/actions/promo");

    await expect(createPromoCodeAction(validPayload)).resolves.toMatchObject({
      success: false,
    });
    await expect(
      updatePromoCodeAction({ ...validPayload, id: "00000000-0000-4000-8000-000000000001" }),
    ).resolves.toMatchObject({ success: false });
    await expect(deletePromoCodeAction("1")).resolves.toMatchObject({
      success: false,
    });

    expect(createPromoCode).not.toHaveBeenCalled();
    expect(updatePromoCode).not.toHaveBeenCalled();
    expect(deletePromoCodeById).not.toHaveBeenCalled();
  });

  it("getPromoCodesAction reaches repo for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    getAllPromoCodes.mockResolvedValue([{ id: "p1" }]);
    const { getPromoCodesAction } = await import("@/actions/promo");
    await expect(getPromoCodesAction()).resolves.toEqual([{ id: "p1" }]);
  });

  it("deletePromoCodeAction succeeds for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    deletePromoCodeById.mockResolvedValue(true);
    const { deletePromoCodeAction } = await import("@/actions/promo");
    await expect(deletePromoCodeAction("1")).resolves.toEqual({ success: true });
  });
});
