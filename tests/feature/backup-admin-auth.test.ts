import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../helpers/mocks";

const getCurrentUserProfile = vi.fn();
const getAdminBackups = vi.fn();
const deleteBackup = vi.fn();
const extractDatabase = vi.fn();

vi.mock("@/services/profile.service", () => ({
  getCurrentUserProfile: (...args: unknown[]) => getCurrentUserProfile(...args),
}));

vi.mock("@/repositories/backup.repository", () => ({
  getAdminBackups: (...args: unknown[]) => getAdminBackups(...args),
  deleteBackup: (...args: unknown[]) => deleteBackup(...args),
  extractDatabase: (...args: unknown[]) => extractDatabase(...args),
}));

describe("backup.service admin authz", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("getAllBackupsAdmin returns [] for non-admin", async () => {
    getCurrentUserProfile.mockResolvedValue(userProfile);
    const { getAllBackupsAdmin } = await import("@/services/backup.service");
    await expect(getAllBackupsAdmin()).resolves.toEqual([]);
    expect(getAdminBackups).not.toHaveBeenCalled();
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
    await expect(
      extractDatabaseService({ format: "sql" }),
    ).resolves.toEqual({
      success: false,
      error: "Forbidden",
    });
    expect(extractDatabase).not.toHaveBeenCalled();
  });

  it("extractDatabaseService reaches repository for admin", async () => {
    getCurrentUserProfile.mockResolvedValue(adminProfile);
    extractDatabase.mockResolvedValue({
      success: true,
      content: "-- dump",
      filename: "database-export.sql",
      mimeType: "application/sql",
    });
    const { extractDatabaseService } = await import("@/services/backup.service");
    await expect(
      extractDatabaseService({ format: "sql" }),
    ).resolves.toEqual({
      success: true,
      content: "-- dump",
      filename: "database-export.sql",
      mimeType: "application/sql",
    });
    expect(extractDatabase).toHaveBeenCalledOnce();
  });
});
