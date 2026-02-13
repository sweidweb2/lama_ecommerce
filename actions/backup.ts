"use server";

import { revalidatePath } from "next/cache";
import type { CreateBackupInput } from "@/lib/validators/backup/create";
import {
  getAllBackupsAdmin,
  createBackupAdmin,
  deleteBackupAdmin,
} from "@/services/backup.service";

export async function getAllBackupsAction() {
  return getAllBackupsAdmin();
}

export async function createBackupAction(input: CreateBackupInput) {
  const result = await createBackupAdmin(input);
  if (!result) {
    return { success: false as const, error: "Failed to create backup record." };
  }
  revalidatePath("/admin/backups");
  return { success: true as const, data: result };
}

export async function deleteBackupAction(id: string) {
  const ok = await deleteBackupAdmin(id);
  if (!ok) {
    return { success: false as const, error: "Failed to delete backup." };
  }
  revalidatePath("/admin/backups");
  return { success: true as const };
}
