import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../helpers/mocks";

const getCurrentUserProfile = vi.fn();
const getAllShippingZonesWithFee = vi.fn();
const createShippingZoneWithFee = vi.fn();
const updateShippingZoneWithFee = vi.fn();
const deleteShippingZoneById = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/services/profile.service", () => ({
  getCurrentUserProfile: (...args: unknown[]) => getCurrentUserProfile(...args),
}));

vi.mock("@/repositories/shipping_zone.repository", () => ({
  getAllShippingZonesWithFee: (...args: unknown[]) =>
    getAllShippingZonesWithFee(...args),
  createShippingZoneWithFee: (...args: unknown[]) =>
    createShippingZoneWithFee(...args),
  updateShippingZoneWithFee: (...args: unknown[]) =>
    updateShippingZoneWithFee(...args),
  deleteShippingZoneById: (...args: unknown[]) =>
    deleteShippingZoneById(...args),
}));

describe("shipping zones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPublicShippingZones has no admin gate", async () => {
    getAllShippingZonesWithFee.mockResolvedValue([{ id: "z1" }]);
    const { getPublicShippingZones } = await import(
      "@/services/shipping_zone.service"
    );
    await expect(getPublicShippingZones()).resolves.toEqual([{ id: "z1" }]);
    expect(getCurrentUserProfile).not.toHaveBeenCalled();
  });

  it("getShippingZonesAction returns [] for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { getShippingZonesAction } = await import("@/actions/shipping");
    await expect(getShippingZonesAction()).resolves.toEqual([]);
    expect(getAllShippingZonesWithFee).not.toHaveBeenCalled();
  });

  it("mutations fail without hitting the repo for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const {
      createShippingZoneAction,
      updateShippingZoneAction,
      deleteShippingZoneAction,
    } = await import("@/actions/shipping");

    await expect(
      createShippingZoneAction({ name: "Amman", estimated_time: null, fee: 5 }),
    ).resolves.toMatchObject({ success: false });
    await expect(
      updateShippingZoneAction({
        id: "00000000-0000-4000-8000-000000000001",
        name: "Amman",
        estimated_time: null,
        fee: 5,
      }),
    ).resolves.toMatchObject({ success: false });
    await expect(deleteShippingZoneAction("z1")).resolves.toMatchObject({
      success: false,
    });

    expect(createShippingZoneWithFee).not.toHaveBeenCalled();
    expect(updateShippingZoneWithFee).not.toHaveBeenCalled();
    expect(deleteShippingZoneById).not.toHaveBeenCalled();
  });

  it("getShippingZonesAction reaches repo for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    getAllShippingZonesWithFee.mockResolvedValue([{ id: "z1" }]);
    const { getShippingZonesAction } = await import("@/actions/shipping");
    await expect(getShippingZonesAction()).resolves.toEqual([{ id: "z1" }]);
  });
});
