import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile } from "../helpers/mocks";

const getCurrentAuthUserFromAction = vi.fn();
const requireAdmin = vi.fn();
const extractDatabaseService = vi.fn();

vi.mock("@/repositories/auth.repository", () => ({
  getCurrentAuthUserFromAction: (...args: unknown[]) =>
    getCurrentAuthUserFromAction(...args),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/services/backup.service", () => ({
  extractDatabaseService: (...args: unknown[]) => extractDatabaseService(...args),
}));

async function readNdjson(res: Response) {
  const text = await res.text();
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function request(url = "http://localhost/api/admin/backups/extract?format=sql") {
  return new Request(url);
}

describe("GET /api/admin/backups/extract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when not authenticated", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/backups/extract/route");
    const res = await GET(request());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(extractDatabaseService).not.toHaveBeenCalled();
  });

  it("returns 403 for non-admin profile", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue({ id: "user-user" });
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const { GET } = await import("@/app/api/admin/backups/extract/route");
    const res = await GET(request());
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
    expect(extractDatabaseService).not.toHaveBeenCalled();
  });

  it("returns 403 when profile is missing", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue({ id: "user-user" });
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const { GET } = await import("@/app/api/admin/backups/extract/route");
    const res = await GET(request());
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
    expect(extractDatabaseService).not.toHaveBeenCalled();
  });

  it("streams complete event for admin on success", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue({ id: "user-admin" });
    requireAdmin.mockResolvedValue(adminProfile);
    extractDatabaseService.mockImplementation(
      async ({
        onProgress,
      }: {
        onProgress?: (event: {
          step: string;
          status: string;
          message: string;
        }) => void;
      }) => {
        onProgress?.({
          step: "connect",
          status: "done",
          message: "Connected",
        });
        return {
          success: true,
          content: "SELECT 1;",
          filename: "database-export-test.sql",
          mimeType: "application/sql",
        };
      },
    );
    const { GET } = await import("@/app/api/admin/backups/extract/route");
    const res = await GET(request());
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/x-ndjson");
    const events = await readNdjson(res);
    expect(events[0]).toMatchObject({
      type: "progress",
      step: "connect",
      status: "done",
    });
    expect(events.at(-1)).toEqual({
      type: "complete",
      filename: "database-export-test.sql",
      mimeType: "application/sql",
      content: "SELECT 1;",
    });
    expect(extractDatabaseService).toHaveBeenCalledOnce();
  });

  it("streams error event when service reports Forbidden", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue({ id: "user-admin" });
    requireAdmin.mockResolvedValue(adminProfile);
    extractDatabaseService.mockResolvedValue({
      success: false,
      error: "Forbidden",
    });
    const { GET } = await import("@/app/api/admin/backups/extract/route");
    const res = await GET(request());
    expect(res.status).toBe(200);
    const events = await readNdjson(res);
    expect(events.at(-1)).toEqual({
      type: "error",
      error: "Forbidden",
    });
  });

  it("streams error event when service fails with other error", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue({ id: "user-admin" });
    requireAdmin.mockResolvedValue(adminProfile);
    extractDatabaseService.mockResolvedValue({
      success: false,
      error: "boom",
    });
    const { GET } = await import("@/app/api/admin/backups/extract/route");
    const res = await GET(request());
    expect(res.status).toBe(200);
    const events = await readNdjson(res);
    expect(events.at(-1)).toEqual({ type: "error", error: "boom" });
  });

  it("returns 400 for invalid format", async () => {
    getCurrentAuthUserFromAction.mockResolvedValue({ id: "user-admin" });
    requireAdmin.mockResolvedValue(adminProfile);
    const { GET } = await import("@/app/api/admin/backups/extract/route");
    const res = await GET(
      request("http://localhost/api/admin/backups/extract?format=xml"),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Invalid format. Use sql, json, or csv.",
    });
    expect(extractDatabaseService).not.toHaveBeenCalled();
  });
});
