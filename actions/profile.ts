"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "@/services/profile.service";
import {
  getProfilesForAdmin,
  updateProfileAdmin,
  deleteProfileAdmin,
} from "@/services/profile.service";
import type { ProfileRole } from "@/types/user";
import { profileAdminUpdateSchema } from "@/lib/validators/user_profile/base";

/**
 * Server action to get the current user's profile.
 * Can be called from Client Components.
 */
export async function getProfile() {
  return await getCurrentUserProfile();
}

/**
 * Get all users (profiles with email) for admin. Returns empty if not admin.
 */
export async function getAdminUsersAction() {
  return await getProfilesForAdmin();
}

/**
 * Update a user's profile (name, role, status) as admin. Revalidates /admin/users.
 */
export async function updateProfileAction(
  profileId: string,
  payload: {
    full_name?: string | null;
    role?: "user" | "admin";
    status?: "Active" | "Blocked";
  }
) {
  const parsed = profileAdminUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }
  const { full_name, role, status } = parsed.data;
  const updates: Parameters<typeof updateProfileAdmin>[1] = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (role !== undefined) updates.role = role as ProfileRole;
  if (status !== undefined) {
    updates.deleted_at = status === "Blocked" ? new Date().toISOString() : null;
  }
  const updated = await updateProfileAdmin(profileId, updates);
  if (!updated) {
    return { success: false, error: "Forbidden or update failed" };
  }
  revalidatePath("/admin/users");
  return { success: true, data: updated };
}

/**
 * Soft-delete a user (set profile deleted_at) as admin. Revalidates /admin/users.
 */
export async function deleteProfileAction(profileId: string) {
  const ok = await deleteProfileAdmin(profileId);
  if (!ok) return { success: false, error: "Forbidden or delete failed" };
  revalidatePath("/admin/users");
  return { success: true };
}
