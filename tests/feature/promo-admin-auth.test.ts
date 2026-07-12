import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../helpers/mocks";

const getCurrentUserProfile = vi.fn();
const getAllPromoCodes = vi.fn();
const createPromoCode = vi.fn();
const updatePromoCode = vi.fn();
const deletePromoCodeById = vi.fn();

vi.mock("@/services/profile.service", () => ({
  getCurrentUserProfile: (...args: unknown[]) => getCurrentUserProfile(...args),
}));

vi.mock("@/repositories/promo_code.repository", () => ({
  getAllPromoCodes: (...args: unknown[]) => getAllPromoCodes(...args),
  createPromoCode: (...args: unknown[]) => createPromoCode(...args),
  updatePromoCode: (...args: unknown[]) => updatePromoCode(...args),
  deletePromoCodeById: (...args: unknown[]) => deletePromoCodeById(...args),
}));

describe("promo_code.service admin gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPromoCodesForAdmin returns [] for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { getPromoCodesForAdmin } = await import(
      "@/services/promo_code.service"
    );
    await expect(getPromoCodesForAdmin()).resolves.toEqual([]);
    expect(getAllPromoCodes).not.toHaveBeenCalled();
  });

  it("create/update/delete return null/false for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const {
      createPromoCodeAdmin,
      updatePromoCodeAdmin,
      deletePromoCodeAdmin,
    } = await import("@/services/promo_code.service");

    await expect(
      createPromoCodeAdmin({ code: "SAVE10" } as never),
    ).resolves.toBeNull();
    await expect(
      updatePromoCodeAdmin({ id: "1", code: "SAVE10" } as never),
    ).resolves.toBeNull();
    await expect(deletePromoCodeAdmin("1")).resolves.toBe(false);
  });

  it("getPromoCodesForAdmin reaches repo for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    getAllPromoCodes.mockResolvedValue([{ id: "p1" }]);
    const { getPromoCodesForAdmin } = await import(
      "@/services/promo_code.service"
    );
    await expect(getPromoCodesForAdmin()).resolves.toEqual([{ id: "p1" }]);
  });
});
