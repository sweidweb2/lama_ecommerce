import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../helpers/mocks";

const getCurrentUserProfile = vi.fn();
const getAdminBackups = vi.fn();
const createBackup = vi.fn();
const deleteBackup = vi.fn();
const extractDatabaseAsSQL = vi.fn();

vi.mock("@/services/profile.service", () => ({
  getCurrentUserProfile: (...args: unknown[]) => getCurrentUserProfile(...args),
}));

vi.mock("@/repositories/backup.repository", () => ({
  getAdminBackups: (...args: unknown[]) => getAdminBackups(...args),
  createBackup: (...args: unknown[]) => createBackup(...args),
  deleteBackup: (...args: unknown[]) => deleteBackup(...args),
  extractDatabaseAsSQL: (...args: unknown[]) => extractDatabaseAsSQL(...args),
}));

describe("backup.service admin authz", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAllBackupsAdmin returns [] for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { getAllBackupsAdmin } = await import("@/services/backup.service");
    await expect(getAllBackupsAdmin()).resolves.toEqual([]);
    expect(getAdminBackups).not.toHaveBeenCalled();
  });

  it("createBackupAdmin returns null for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { createBackupAdmin } = await import("@/services/backup.service");
    await expect(
      createBackupAdmin({ name: "nightly", type: "full" }),
    ).resolves.toBeNull();
    expect(createBackup).not.toHaveBeenCalled();
  });

  it("deleteBackupAdmin returns false for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { deleteBackupAdmin } = await import("@/services/backup.service");
    await expect(deleteBackupAdmin("backup-1")).resolves.toBe(false);
    expect(deleteBackup).not.toHaveBeenCalled();
  });

  it("extractDatabaseService returns Forbidden for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { extractDatabaseService } = await import("@/services/backup.service");
    await expect(extractDatabaseService()).resolves.toEqual({
      success: false,
      error: "Forbidden",
    });
    expect(extractDatabaseAsSQL).not.toHaveBeenCalled();
  });

  it("createBackupAdmin reaches repository for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    createBackup.mockResolvedValue({
      id: "backup-1",
      name: "nightly",
      type: "full",
    });
    const { createBackupAdmin } = await import("@/services/backup.service");
    const result = await createBackupAdmin({ name: "nightly", type: "full" });
    expect(result).toMatchObject({ id: "backup-1" });
    expect(createBackup).toHaveBeenCalled();
  });
});
