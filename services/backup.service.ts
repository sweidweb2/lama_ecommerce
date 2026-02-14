import {
  createBackupSchema,
  type CreateBackupInput,
} from "@/lib/validators/backup/create";
import type { BackupRow } from "@/repositories/backup.repository";
import {
  getAdminBackups,
  createBackup,
  deleteBackup,
} from "@/repositories/backup.repository";

/**
 * Get all backup records for admin.
 */
export async function getAllBackupsAdmin(): Promise<BackupRow[]> {
  return getAdminBackups();
}

/**
 * Create a backup record (metadata). Actual backup generation is external.
 */
export async function createBackupAdmin(input: unknown): Promise<BackupRow | null> {
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
  return deleteBackup(id);
}
