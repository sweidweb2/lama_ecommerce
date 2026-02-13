import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface BackupRow {
  id: string;
  name: string;
  type: string;
  size: string | null;
  storage_path: string | null;
  created_at: string;
}

export interface CreateBackupRepoInput {
  name: string;
  type: "full" | "incremental";
  size?: string | null;
  storage_path?: string | null;
}

/**
 * Fetch all backups for admin (newest first).
 */
export async function getAdminBackups(): Promise<BackupRow[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("backups")
      .select("id, name, type, size, storage_path, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      const msg = (error as { message?: string }).message ?? JSON.stringify(error);
      const code = (error as { code?: string }).code;
      console.error("Failed to fetch backups:", code ? `[${code}] ${msg}` : msg);
      return [];
    }
    return (data ?? []) as BackupRow[];
  } catch (err) {
    console.error("Unexpected error in getAdminBackups:", err);
    return [];
  }
}

/**
 * Create a backup record (metadata). Actual backup file generation is external/cron.
 */
export async function createBackup(input: CreateBackupRepoInput): Promise<BackupRow | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("backups")
      .insert({
        name: input.name,
        type: input.type,
        size: input.size ?? null,
        storage_path: input.storage_path ?? null,
      })
      .select("id, name, type, size, storage_path, created_at")
      .single();

    if (error) {
      const msg = (error as { message?: string }).message ?? JSON.stringify(error);
      const code = (error as { code?: string }).code;
      console.error("Failed to create backup:", code ? `[${code}] ${msg}` : msg);
      return null;
    }
    return data as BackupRow;
  } catch (err) {
    console.error("Unexpected error in createBackup:", err);
    return null;
  }
}

/**
 * Delete a backup record by id.
 */
export async function deleteBackup(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await (supabase as any)
      .from("backups")
      .delete()
      .eq("id", id);

    if (error) {
      const msg = (error as { message?: string }).message ?? JSON.stringify(error);
      const code = (error as { code?: string }).code;
      console.error("Failed to delete backup:", code ? `[${code}] ${msg}` : msg);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error in deleteBackup:", err);
    return false;
  }
}
