import { ROLES, type RoleValue } from "@/lib/constants/roles";

/**
 * Check if a user role has admin access.
 * @param role - The user's role (RoleValue | null | undefined)
 * @returns true if role is ADMIN, false otherwise
 */
export function canAccessAdmin(
  role: RoleValue | null | undefined
): boolean {
  return role === ROLES.ADMIN;
}

/**
 * Check if a user can edit a specific profile.
 * Users can only edit their own profile.
 * @param userId - The ID of the profile being edited
 * @param authUserId - The ID of the authenticated user
 * @returns true if authUserId matches userId, false otherwise
 */
export function canEditProfile(
  userId: string,
  authUserId: string | null | undefined
): boolean {
  return !!authUserId && userId === authUserId;
}
