"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "@/services/profile.service";
import {
  getProfilesForAdmin,
  getUsersWithoutActiveCarts,
  updateProfileAdmin,
  createUserAdmin,
} from "@/services/profile.service";
import type { ProfileRole } from "@/types/user";
import { profileAdminUpdateSchema } from "@/lib/validators/user_profile/base";
import { createUserSchema } from "@/lib/validators/user_profile/create";

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
 * Get users without active carts for admin. Returns empty if not admin.
 */
export async function getUsersWithoutActiveCartsAction() {
  return await getUsersWithoutActiveCarts();
}

/**
 * Update a user's profile (name, role, status) as admin. Revalidates /admin/users.
 * status: active = is_active true, inactive = is_active false.
 */
export async function updateProfileAction(
  profileId: string,
  payload: {
    full_name?: string | null;
    role?: "user" | "admin";
    status?: "active" | "inactive";
  },
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
    updates.is_active = status === "active";
  }
  const updated = await updateProfileAdmin(profileId, updates);
  if (!updated) {
    return { success: false, error: "Forbidden or update failed" };
  }
  revalidatePath("/admin/users");
  return { success: true, data: updated };
}

/**
 * Create a new user (email, password, name, role, status) as admin.
 * Revalidates /admin/users on success.
 */
export async function createUserAction(payload: {
  full_name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  status: "active" | "inactive";
}) {
  const parsed = createUserSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.full_name?.[0] ??
      first.email?.[0] ??
      first.password?.[0] ??
      "Invalid input";
    return { success: false, error: msg };
  }

  const result = await createUserAdmin({
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    password: parsed.data.password,
    role: parsed.data.role,
    status: parsed.data.status,
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  revalidatePath("/admin/users");
  return { success: true, data: result.data };
}
