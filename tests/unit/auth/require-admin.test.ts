import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../../helpers/mocks";

const getCurrentUserProfile = vi.fn();

vi.mock("@/services/profile.service", () => ({
  getCurrentUserProfile: (...args: unknown[]) => getCurrentUserProfile(...args),
}));

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the profile for an admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    const { requireAdmin } = await import("@/lib/auth/require-admin");
    await expect(requireAdmin()).resolves.toEqual(adminProfile);
  });

  it("throws Unauthorized for a normal user", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { requireAdmin } = await import("@/lib/auth/require-admin");
    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });

  it("throws Unauthorized for an inactive admin", async () => {
    getCurrentUserProfile.mockResolvedValue({
      ...adminProfile,
      is_active: false,
    });
    const { requireAdmin } = await import("@/lib/auth/require-admin");
    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });

  it("throws Unauthorized when no profile", async () => {
    getCurrentUserProfile.mockResolvedValue(null);
    const { requireAdmin } = await import("@/lib/auth/require-admin");
    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });
});
