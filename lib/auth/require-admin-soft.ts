import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * Soft admin check for list/CRUD actions that return empty/null instead of throwing.
 * Same gate as `requireAdmin` (role + is_active); catches Unauthorized as false.
 */
export async function isAdminCaller(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
