"use server";

import { revalidatePath } from "next/cache";
import { deleteBackupAdmin } from "@/services/backup.service";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function deleteBackupAction(id: string) {
  try {
    await requireAdmin();
  } catch {
    return { success: false as const, error: "Forbidden" };
  }

  const ok = await deleteBackupAdmin(id);
  if (!ok) {
    return { success: false as const, error: "Failed to delete backup." };
  }
  revalidatePath("/admin/backups");
  return { success: true as const };
}
