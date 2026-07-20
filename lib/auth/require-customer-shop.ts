import {
  ADMIN_CANNOT_SHOP_MESSAGE,
  canAccessAdmin,
} from "@/lib/auth/permissions";
import {
  getAdminShopBlockForUserId,
  getCurrentUserProfile,
} from "@/services/profile.service";

export { getAdminShopBlockForUserId };

/**
 * If the current session is an admin, return the shop-block error message.
 * Guests / customers return null (not blocked).
 */
export async function getAdminShopBlockForCurrentUser(): Promise<string | null> {
  const profile = await getCurrentUserProfile();
  if (profile && canAccessAdmin(profile.role)) {
    return ADMIN_CANNOT_SHOP_MESSAGE;
  }
  return null;
}
