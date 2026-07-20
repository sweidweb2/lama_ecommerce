import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile, userProfile } from "../helpers/mocks";

const getCurrentAuthUserFromAction = vi.fn();
const getProfileByUserId = vi.fn();
const extractDatabaseService = vi.fn();

vi.mock("@/repositories/auth.repository", () => ({
  getCurrentAuthUserFromAction: (...args: unknown[]) =>
    getCurrentAuthUserFromAction(...args),
}));

vi.mock("@/repositories/profile.repository", () => ({
  getProfileByUserId: (...args: unknown[]) => getProfileByUserId(...args),
}));

vi.mock("@/services/backup.service", () => ({
  extractDatabaseService: (...args: unknown[]) => extractDatabaseService(...args),
}));

describe("GET /api/admin/backups/extract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when not authenticated", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/backups/extract/route");
    const res = await GET();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(extractDatabaseService).not.toHaveBeenCalled();
  });

  it("returns 403 for non-admin profile", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue({ id: "user-user" });
    getProfileByUserId.mockResolvedValue(userProfile);
    const { GET } = await import("@/app/api/admin/backups/extract/route");
    const res = await GET();
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
    expect(extractDatabaseService).not.toHaveBeenCalled();
  });

  it("returns 403 when profile is missing", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue({ id: "user-user" });
    getProfileByUserId.mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/backups/extract/route");
    const res = await GET();
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
    expect(extractDatabaseService).not.toHaveBeenCalled();
  });

  it("returns SQL download for admin on success", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue({ id: "user-admin" });
    getProfileByUserId.mockResolvedValue(adminProfile);
    extractDatabaseService.mockResolvedValue({
      success: true,
      sql: "SELECT 1;",
    });
    const { GET } = await import("@/app/api/admin/backups/extract/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/sql");
    expect(res.headers.get("Content-Disposition")).toMatch(
      /attachment; filename="database-export-.*\.sql"/,
    );
    await expect(res.text()).resolves.toBe("SELECT 1;");
    expect(extractDatabaseService).toHaveBeenCalledOnce();
  });

  it("returns 403 when service reports Forbidden", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue({ id: "user-admin" });
    getProfileByUserId.mockResolvedValue(adminProfile);
    extractDatabaseService.mockResolvedValue({
      success: false,
      error: "Forbidden",
    });
    const { GET } = await import("@/app/api/admin/backups/extract/route");
    const res = await GET();
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("returns 500 when service fails with other error", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue({ id: "user-admin" });
    getProfileByUserId.mockResolvedValue(adminProfile);
    extractDatabaseService.mockResolvedValue({
      success: false,
      error: "boom",
    });
    const { GET } = await import("@/app/api/admin/backups/extract/route");
    const res = await GET();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "boom" });
  });
});
