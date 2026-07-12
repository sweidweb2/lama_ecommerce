import {
  createBackupSchema,
  type CreateBackupInput,
} from "@/lib/validators/backup/create";
import type { BackupRow } from "@/repositories/backup.repository";
import {
  getAdminBackups,
  createBackup,
  deleteBackup,
  extractDatabaseAsSQL,
} from "@/repositories/backup.repository";
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
 * Create a backup record (metadata). Actual backup generation is external.
 */
export async function createBackupAdmin(input: unknown): Promise<BackupRow | null> {
  const profile = await getCurrentUserProfile();
  if (!profile || !canAccessAdmin(profile.role)) return null;

  const parsed = createBackupSchema.parse(input) as CreateBackupInput;
  return createBackup({
    name: parsed.name,
    type: parsed.type,
    size: parsed.size ?? null,
    storage_path: parsed.storage_path ?? null,
  });
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
export async function extractDatabaseService(): Promise<{ success: boolean; error?: string; sql?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile || !canAccessAdmin(profile.role)) {
    return { success: false, error: "Forbidden" };
  }
  return extractDatabaseAsSQL();
}
