import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../helpers/mocks";

const getCurrentUserProfile = vi.fn();
const getAllShippingZonesWithFee = vi.fn();
const createShippingZoneWithFee = vi.fn();
const updateShippingZoneWithFee = vi.fn();
const deleteShippingZoneById = vi.fn();

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

describe("shipping_zone.service", () => {
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

  it("getShippingZonesForAdmin returns [] for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { getShippingZonesForAdmin } = await import(
      "@/services/shipping_zone.service"
    );
    await expect(getShippingZonesForAdmin()).resolves.toEqual([]);
    expect(getAllShippingZonesWithFee).not.toHaveBeenCalled();
  });

  it("mutations return null/false for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const {
      createShippingZoneAdmin,
      updateShippingZoneAdmin,
      deleteShippingZoneAdmin,
    } = await import("@/services/shipping_zone.service");

    await expect(
      createShippingZoneAdmin({ name: "Amman", fee: 5 } as never),
    ).resolves.toBeNull();
    await expect(
      updateShippingZoneAdmin({ id: "z1", name: "Amman" } as never),
    ).resolves.toBeNull();
    await expect(deleteShippingZoneAdmin("z1")).resolves.toBe(false);
  });

  it("getShippingZonesForAdmin reaches repo for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    getAllShippingZonesWithFee.mockResolvedValue([{ id: "z1" }]);
    const { getShippingZonesForAdmin } = await import(
      "@/services/shipping_zone.service"
    );
    await expect(getShippingZonesForAdmin()).resolves.toEqual([{ id: "z1" }]);
  });
});
