import { ROLES } from "@/lib/constants/roles";
import { getCurrentUserProfile } from "@/services/profile.service";

/**
 * Soft admin check for list/CRUD actions that return empty/null instead of throwing.
 * Matches historical promo/shipping behavior (role === ADMIN only, no is_active gate).
 */
export async function isAdminCaller(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return !!profile && profile.role === ROLES.ADMIN;
}
