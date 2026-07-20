import { ROLES, type RoleValue } from "@/lib/constants/roles";

/** Stable message when an admin tries storefront commerce. */
export const ADMIN_CANNOT_SHOP_MESSAGE =
  "Admins cannot shop on the storefront";

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
 * Check if a role may use customer commerce (cart, wishlist, checkout, reviews).
 * Admins are operators, not shoppers.
 */
export function canShopAsCustomer(
  role: RoleValue | null | undefined
): boolean {
  return role === ROLES.USER;
}

/**
 * Throw if the profile is an admin trying to shop.
 * Call from services that accept a user-scoped commerce mutation.
 */
export function assertCanShopAsCustomer(
  role: RoleValue | null | undefined
): void {
  if (canAccessAdmin(role)) {
    throw new Error(ADMIN_CANNOT_SHOP_MESSAGE);
  }
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
