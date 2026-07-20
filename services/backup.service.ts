import type { BackupRow } from "@/repositories/backup.repository";
import {
  getAdminBackups,
  createBackup,
  deleteBackup,
  extractDatabaseAsSQL,
} from "@/repositories/backup.repository";
import { createBackupSchema } from "@/lib/validators/backup/create";
import { getCurrentUserProfile } from "@/services/profile.service";
import { canAccessAdmin } from "@/lib/auth/permissions";

/**
 * Get all backup records for admin.
 */
export async function getAllBackupsAdmin(): Promise<BackupRow[]> {
  const profile = await getCurrentUserProfile();
  if (!profile || !canAccessAdmin(profile.role)) return [];
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
  const profile = await getCurrentUserProfile();
  if (!profile || !canAccessAdmin(profile.role)) {
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
  const profile = await getCurrentUserProfile();
  if (!profile || !canAccessAdmin(profile.role)) return false;
  return deleteBackup(id);
}

/**
 * Extract database as SQL dump.
 */
export async function extractDatabaseService(): Promise<{
  success: boolean;
  error?: string;
  sql?: string;
}> {
  const profile = await getCurrentUserProfile();
  if (!profile || !canAccessAdmin(profile.role)) {
    return { success: false, error: "Forbidden" };
  }
  return extractDatabaseAsSQL();
}
