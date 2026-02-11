import type { Profile, ProfileRole } from "@/types/user";
import {
  getProfileByUserId,
  getAllProfilesForAdmin,
  updateProfileById,
  softDeleteProfileById,
  type AdminProfileRow,
} from "@/repositories/profile.repository";
import { getCurrentAuthUserFromComponent } from "@/repositories/auth.repository";
import { ROLES } from "@/lib/constants/roles";

/**
 * Get the current authenticated user's profile (including `role`).
 *
 * - Uses the auth repository to get the current user (Server Component context).
 * - If no user is authenticated, returns `null`.
 * - Otherwise loads the profile for `user.id` from the profile repository.
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  try {
    const user = await getCurrentAuthUserFromComponent();
    if (!user) return null;

    const profile = await getProfileByUserId(user.id);
    if (!profile) return null;

    const role = profile.role as ProfileRole;
    return { ...profile, role };
  } catch (error) {
    const isDynamicRenderingError =
      error instanceof Error &&
      (error.message.includes("Dynamic server usage") ||
        error.message.includes("couldn't be rendered statically") ||
        error.message.includes("used `cookies`") ||
        (error as any).digest === "DYNAMIC_SERVER_USAGE");

    if (isDynamicRenderingError) return null;
    console.error("Unexpected error in getCurrentUserProfile:", error);
    return null;
  }
}

/**
 * Get all profiles with email for admin. Returns empty if caller is not admin.
 */
export async function getProfilesForAdmin(): Promise<AdminProfileRow[]> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) return [];
  return getAllProfilesForAdmin();
}

/**
 * Update a profile (full_name, role, deleted_at) as admin. Fails if caller is not admin.
 */
export async function updateProfileAdmin(
  profileId: string,
  updates: {
    full_name?: string | null;
    role?: ProfileRole;
    deleted_at?: string | null;
  }
): Promise<Profile | null> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) return null;
  return updateProfileById(profileId, updates);
}

/**
 * Soft-delete a profile (set deleted_at) as admin. Fails if caller is not admin.
 */
export async function deleteProfileAdmin(profileId: string): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) return false;
  return softDeleteProfileById(profileId);
}
