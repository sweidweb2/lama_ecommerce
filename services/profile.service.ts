import type { Profile, ProfileRole } from "@/types/user";
import {
  getProfileByUserId,
  getAllProfilesForAdmin,
  updateProfileById,
  createUserAndProfile,
  type AdminProfileRow,
} from "@/repositories/profile.repository";
import { getUserIdsWithActiveCarts } from "@/repositories/cart.repository";
import { getCurrentAuthUserFromComponent, signOutFromAction } from "@/repositories/auth.repository";
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
 * Get users (profiles) without active carts for admin.
 * Returns empty if caller is not admin.
 */
export async function getUsersWithoutActiveCarts(): Promise<AdminProfileRow[]> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) return [];
  
  // Get all profiles
  const allProfiles = await getAllProfilesForAdmin();
  
  // Get user IDs with active carts
  const userIdsWithActiveCarts = await getUserIdsWithActiveCarts();
  
  // Filter out users with active carts and inactive users
  return allProfiles.filter(
    (profile) =>
      profile.user_id &&
      !userIdsWithActiveCarts.includes(profile.user_id) &&
      !profile.deleted_at // Only include active users
  );
}

/**
 * Update a profile (full_name, role, deleted_at/status) as admin. Fails if caller is not admin.
 */
export async function updateProfileAdmin(
  profileId: string,
  updates: {
    full_name?: string | null;
    role?: ProfileRole;
    deleted_at?: string | null;
  },
): Promise<Profile | null> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) return null;
  return updateProfileById(profileId, updates);
}

export type CreateUserAdminResult =
  | { ok: true; data: AdminProfileRow }
  | { ok: false; error: string };

/**
 * Create a new user (auth + profile) as admin. Fails if caller is not admin.
 */
export async function createUserAdmin(params: {
  email: string;
  password: string;
  full_name: string;
  role: ProfileRole;
  status: "active" | "inactive";
}): Promise<CreateUserAdminResult> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== ROLES.ADMIN) {
    return { ok: false, error: "Forbidden" };
  }

  const deleted_at =
    params.status === "inactive" ? new Date().toISOString() : null;

  const result = await createUserAndProfile({
    email: params.email,
    password: params.password,
    full_name: params.full_name,
    role: params.role,
    deleted_at,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    data: {
      id: result.profile.id,
      user_id: result.user_id,
      full_name: result.profile.full_name,
      role: result.profile.role,
      created_at: result.profile.created_at,
      deleted_at: result.profile.deleted_at,
      email: params.email.trim().toLowerCase(),
    },
  };
}

/**
 * Server-side logout (Server Action context). Clears the auth session cookies.
 */
export async function logoutServerService(): Promise<{
  success: boolean;
  error?: string;
}> {
  return signOutFromAction();
}
