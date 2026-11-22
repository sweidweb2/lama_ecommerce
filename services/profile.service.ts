import type { Profile, ProfileRole } from "@/types/user";
import {
  getProfileByUserId,
  getProfileByUserIdAdmin,
  getAllProfilesForAdmin,
  getProfileByIdAdmin,
  listProfilesForAdmin,
  listActiveProfilesExcludingUserIds,
  updateProfileById,
  createUserAndProfile,
  updateAuthUserPassword,
  type AdminProfileRow,
  type ListProfilesForAdminParams,
  type ListProfilesForAdminResult,
} from "@/repositories/profile.repository";
import { getUserIdsWithActiveCarts } from "@/repositories/cart.repository";
import { getCurrentAuthUserFromComponent } from "@/repositories/auth.repository";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  ADMIN_CANNOT_SHOP_MESSAGE,
  canAccessAdmin,
} from "@/lib/auth/permissions";

export type { ListProfilesForAdminParams, ListProfilesForAdminResult };

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
 * If this auth user id is an admin, return the storefront shop-block message.
 */
export async function getAdminShopBlockForUserId(
  userId: string,
): Promise<string | null> {
  const profile = await getProfileByUserIdAdmin(userId);
  if (profile && canAccessAdmin(profile.role)) {
    return ADMIN_CANNOT_SHOP_MESSAGE;
  }
  return null;
}

/**
 * Get all profiles with email for admin. Returns empty if caller is not admin.
 * Prefer listProfilesForAdminService for paged UI lists.
 */
export async function getProfilesForAdmin(): Promise<AdminProfileRow[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getAllProfilesForAdmin();
}

/**
 * Paginated profiles with email for admin users table.
 */
export async function listProfilesForAdminService(
  params: ListProfilesForAdminParams,
): Promise<ListProfilesForAdminResult> {
  try {
    await requireAdmin();
  } catch {
    return { items: [], total: 0 };
  }
  return listProfilesForAdmin(params);
}

/**
 * Get users (profiles) without active carts for admin.
 * Returns empty if caller is not admin.
 */
export async function getUsersWithoutActiveCarts(): Promise<AdminProfileRow[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }

  const userIdsWithActiveCarts = await getUserIdsWithActiveCarts();
  return listActiveProfilesExcludingUserIds(userIdsWithActiveCarts);
}

/**
 * Update the current user's own profile (`full_name` only).
 * Returns null if unauthenticated or update fails.
 */
export async function updateOwnProfile(
  fullName: string,
): Promise<Profile | null> {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  return updateProfileById(profile.id, { full_name: fullName });
}

/**
 * Update a profile (full_name, role, is_active/status) as admin. Fails if caller is not admin.
 */
export async function updateProfileAdmin(
  profileId: string,
  updates: {
    full_name?: string | null;
    role?: ProfileRole;
    is_active?: boolean;
  },
): Promise<Profile | null> {
  try {
    await requireAdmin();
  } catch {
    return null;
  }
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
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Forbidden" };
  }

  const is_active = params.status === "active";

  const result = await createUserAndProfile({
    email: params.email,
    password: params.password,
    full_name: params.full_name,
    role: params.role,
    is_active,
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
      is_active: result.profile.is_active,
      email: params.email.trim().toLowerCase(),
    },
  };
}

export type ResetUserPasswordAdminResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Set a user's auth password as admin. Fails if caller is not admin.
 * Resolves auth user id from profile id (never trusts client-supplied auth id).
 */
export async function resetUserPasswordAdmin(
  profileId: string,
  password: string,
): Promise<ResetUserPasswordAdminResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Forbidden" };
  }

  const target = await getProfileByIdAdmin(profileId);
  if (!target?.user_id) {
    return { ok: false, error: "User not found" };
  }

  return updateAuthUserPassword(target.user_id, password);
}
