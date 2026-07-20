import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../helpers/mocks";

const getCurrentAuthUserFromComponent = vi.fn();
const getProfileByUserId = vi.fn();
const getProfileByIdAdmin = vi.fn();
const updateAuthUserPassword = vi.fn();

vi.mock("@/repositories/auth.repository", () => ({
  getCurrentAuthUserFromComponent: (...args: unknown[]) =>
    getCurrentAuthUserFromComponent(...args),
}));

vi.mock("@/repositories/profile.repository", () => ({
  getProfileByUserId: (...args: unknown[]) => getProfileByUserId(...args),
  getProfileByUserIdAdmin: vi.fn(),
  getAllProfilesForAdmin: vi.fn(),
  listProfilesForAdmin: vi.fn(),
  listActiveProfilesExcludingUserIds: vi.fn(),
  updateProfileById: vi.fn(),
  createUserAndProfile: vi.fn(),
  getProfileByIdAdmin: (...args: unknown[]) => getProfileByIdAdmin(...args),
  updateAuthUserPassword: (...args: unknown[]) => updateAuthUserPassword(...args),
}));

vi.mock("@/repositories/cart.repository", () => ({
  getUserIdsWithActiveCarts: vi.fn(),
}));

describe("resetUserPasswordAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns Forbidden for non-admin without calling Auth", async () => {
    getCurrentAuthUserFromComponent.mockResolvedValue({ id: userProfile.user_id });
    getProfileByUserId.mockResolvedValue(userProfile);
    const { resetUserPasswordAdmin } = await import("@/services/profile.service");
    const result = await resetUserPasswordAdmin("profile-1", "password123");
    expect(result).toEqual({ ok: false, error: "Forbidden" });
    expect(getProfileByIdAdmin).not.toHaveBeenCalled();
    expect(updateAuthUserPassword).not.toHaveBeenCalled();
  });

  it("returns User not found when profile missing", async () => {
    getCurrentAuthUserFromComponent.mockResolvedValue({ id: adminProfile.user_id });
    getProfileByUserId.mockResolvedValue(adminProfile);
    getProfileByIdAdmin.mockResolvedValue(null);
    const { resetUserPasswordAdmin } = await import("@/services/profile.service");
    const result = await resetUserPasswordAdmin("missing", "password123");
    expect(result).toEqual({ ok: false, error: "User not found" });
    expect(updateAuthUserPassword).not.toHaveBeenCalled();
  });

  it("reaches Auth update for admin with valid profile", async () => {
    getCurrentAuthUserFromComponent.mockResolvedValue({ id: adminProfile.user_id });
    getProfileByUserId.mockResolvedValue(adminProfile);
    getProfileByIdAdmin.mockResolvedValue({
      id: "profile-1",
      user_id: "auth-user-1",
    });
    updateAuthUserPassword.mockResolvedValue({ ok: true });
    const { resetUserPasswordAdmin } = await import("@/services/profile.service");
    const result = await resetUserPasswordAdmin("profile-1", "password123");
    expect(result).toEqual({ ok: true });
    expect(updateAuthUserPassword).toHaveBeenCalledWith(
      "auth-user-1",
      "password123",
    );
  });
});

describe("resetUserPasswordAction validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("rejects short password without calling Auth", async () => {
    getCurrentAuthUserFromComponent.mockResolvedValue({ id: adminProfile.user_id });
    getProfileByUserId.mockResolvedValue(adminProfile);
    const { resetUserPasswordAction } = await import("@/actions/profile");
    const result = await resetUserPasswordAction("profile-1", {
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/at least 8/i);
    }
    expect(getProfileByIdAdmin).not.toHaveBeenCalled();
    expect(updateAuthUserPassword).not.toHaveBeenCalled();
  });

  it("rejects mismatched confirm password", async () => {
    getCurrentAuthUserFromComponent.mockResolvedValue({ id: adminProfile.user_id });
    getProfileByUserId.mockResolvedValue(adminProfile);
    const { resetUserPasswordAction } = await import("@/actions/profile");
    const result = await resetUserPasswordAction("profile-1", {
      password: "password123",
      confirmPassword: "password456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/do not match/i);
    }
    expect(updateAuthUserPassword).not.toHaveBeenCalled();
  });
});
