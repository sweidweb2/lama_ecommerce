import type { BackupRow } from "@/repositories/backup.repository";
import {
  getAdminBackups,
  createBackup,
  deleteBackup,
  extractDatabase,
} from "@/repositories/backup.repository";
import { createBackupSchema } from "@/lib/validators/backup/create";
import {
  extractFormatSchema,
  type ExtractFormat,
  type ExtractProgressEvent,
} from "@/lib/validators/backup/extract";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * Get all backup records for admin.
 */
export async function getAllBackupsAdmin(): Promise<BackupRow[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getAdminBackups();
}

/**
 * Create a backup metadata record (admin). UI create was removed; action may still be used.
 */
export async function createBackupAdmin(
  input: unknown,
): Promise<
  { success: true; data: BackupRow } | { success: false; error: string }
> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const parsed = createBackupSchema.safeParse(input);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message || "Invalid backup data";
    return { success: false, error: message };
  }

  const data = await createBackup({
    name: parsed.data.name,
    type: parsed.data.type,
    size: parsed.data.size ?? null,
    storage_path: parsed.data.storage_path ?? null,
  });
  if (!data) {
    return { success: false, error: "Failed to create backup" };
  }
  return { success: true, data };
}

/**
 * Delete a backup record by id.
 */
export async function deleteBackupAdmin(id: string): Promise<boolean> {
  try {
    await requireAdmin();
  } catch {
    return false;
  }
  return deleteBackup(id);
}

/**
 * Extract database dump in the requested format.
 */
export async function extractDatabaseService(options: {
  format: ExtractFormat;
  onProgress?: (event: Omit<ExtractProgressEvent, "type">) => void;
}): Promise<{
  success: boolean;
  error?: string;
  content?: string;
  filename?: string;
  mimeType?: string;
}> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const parsed = extractFormatSchema.safeParse(options.format);
  if (!parsed.success) {
    return { success: false, error: "Invalid extract format" };
  }

  return extractDatabase({
    format: parsed.data,
    onProgress: options.onProgress,
  });
}
