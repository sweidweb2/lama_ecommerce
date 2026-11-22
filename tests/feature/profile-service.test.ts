import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../helpers/mocks";
import { ADMIN_CANNOT_SHOP_MESSAGE } from "@/lib/auth/permissions";

const getCurrentAuthUserFromComponent = vi.fn();
const getProfileByUserId = vi.fn();
const getProfileByUserIdAdmin = vi.fn();
const getAllProfilesForAdmin = vi.fn();
const listProfilesForAdmin = vi.fn();
const listActiveProfilesExcludingUserIds = vi.fn();
const updateProfileById = vi.fn();
const createUserAndProfile = vi.fn();
const getUserIdsWithActiveCarts = vi.fn();

vi.mock("@/repositories/auth.repository", () => ({
  getCurrentAuthUserFromComponent: (...args: unknown[]) =>
    getCurrentAuthUserFromComponent(...args),
}));

vi.mock("@/repositories/profile.repository", () => ({
  getProfileByUserId: (...args: unknown[]) => getProfileByUserId(...args),
  getProfileByUserIdAdmin: (...args: unknown[]) =>
    getProfileByUserIdAdmin(...args),
  getAllProfilesForAdmin: (...args: unknown[]) =>
    getAllProfilesForAdmin(...args),
  getProfileByIdAdmin: vi.fn(),
  listProfilesForAdmin: (...args: unknown[]) => listProfilesForAdmin(...args),
  listActiveProfilesExcludingUserIds: (...args: unknown[]) =>
    listActiveProfilesExcludingUserIds(...args),
  updateProfileById: (...args: unknown[]) => updateProfileById(...args),
  createUserAndProfile: (...args: unknown[]) => createUserAndProfile(...args),
  updateAuthUserPassword: vi.fn(),
}));

vi.mock("@/repositories/cart.repository", () => ({
  getUserIdsWithActiveCarts: (...args: unknown[]) =>
    getUserIdsWithActiveCarts(...args),
}));

describe("profile.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCurrentUserProfile returns null when unauthenticated", async () => {
    getCurrentAuthUserFromComponent.mockResolvedValue(null);
    const { getCurrentUserProfile } = await import(
      "@/services/profile.service"
    );
    await expect(getCurrentUserProfile()).resolves.toBeNull();
  });

  it("getCurrentUserProfile returns profile for auth user", async () => {
    getCurrentAuthUserFromComponent.mockResolvedValue({ id: userProfile.user_id });
    getProfileByUserId.mockResolvedValue(userProfile);
    const { getCurrentUserProfile } = await import(
      "@/services/profile.service"
    );
    await expect(getCurrentUserProfile()).resolves.toMatchObject({
      user_id: userProfile.user_id,
      role: userProfile.role,
    });
  });

  it("getAdminShopBlockForUserId returns message for admin", async () => {
    getProfileByUserIdAdmin.mockResolvedValue(adminProfile);
    const { getAdminShopBlockForUserId } = await import(
      "@/services/profile.service"
    );
    await expect(
      getAdminShopBlockForUserId(adminProfile.user_id),
    ).resolves.toBe(ADMIN_CANNOT_SHOP_MESSAGE);
  });

  it("getAdminShopBlockForUserId returns null for normal user", async () => {
    getProfileByUserIdAdmin.mockResolvedValue(userProfile);
    const { getAdminShopBlockForUserId } = await import(
      "@/services/profile.service"
    );
    await expect(
      getAdminShopBlockForUserId(userProfile.user_id),
    ).resolves.toBeNull();
  });

  it("admin list helpers return empty for non-admin", async () => {
    getCurrentAuthUserFromComponent.mockResolvedValue({ id: userProfile.user_id });
    getProfileByUserId.mockResolvedValue(userProfile);
    const {
      getProfilesForAdmin,
      listProfilesForAdminService,
      getUsersWithoutActiveCarts,
      updateProfileAdmin,
      createUserAdmin,
    } = await import("@/services/profile.service");

    await expect(getProfilesForAdmin()).resolves.toEqual([]);
    await expect(
      listProfilesForAdminService({ page: 1, pageSize: 10 }),
    ).resolves.toEqual({ items: [], total: 0 });
    await expect(getUsersWithoutActiveCarts()).resolves.toEqual([]);
    await expect(
      updateProfileAdmin("p1", { full_name: "X" }),
    ).resolves.toBeNull();
    await expect(
      createUserAdmin({
        email: "a@b.com",
        password: "password123",
        full_name: "A",
        role: "user",
        status: "active",
      }),
    ).resolves.toEqual({ ok: false, error: "Forbidden" });
    expect(getAllProfilesForAdmin).not.toHaveBeenCalled();
  });

  it("updateOwnProfile updates full_name for current user", async () => {
    getCurrentAuthUserFromComponent.mockResolvedValue({ id: userProfile.user_id });
    getProfileByUserId.mockResolvedValue(userProfile);
    updateProfileById.mockResolvedValue({
      ...userProfile,
      full_name: "Updated Name",
    });
    const { updateOwnProfile } = await import("@/services/profile.service");
    await expect(updateOwnProfile("Updated Name")).resolves.toMatchObject({
      full_name: "Updated Name",
    });
    expect(updateProfileById).toHaveBeenCalledWith(userProfile.id, {
      full_name: "Updated Name",
    });
  });

  it("listProfilesForAdminService reaches repo for admin", async () => {
    getCurrentAuthUserFromComponent.mockResolvedValue({
      id: adminProfile.user_id,
    });
    getProfileByUserId.mockResolvedValue(adminProfile);
    listProfilesForAdmin.mockResolvedValue({
      items: [{ id: "p1" }],
      total: 1,
    });
    const { listProfilesForAdminService } = await import(
      "@/services/profile.service"
    );
    await expect(
      listProfilesForAdminService({ page: 1, pageSize: 10 }),
    ).resolves.toEqual({ items: [{ id: "p1" }], total: 1 });
  });
});
