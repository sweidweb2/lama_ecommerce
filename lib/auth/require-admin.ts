import { cache } from "react";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { getCurrentUserProfile } from "@/services/profile.service";
import type { Profile } from "@/types/user";

/**
 * Ensure the current user is an authenticated admin.
 * Throws "Unauthorized" if not — same pattern as admin product actions.
 * Cached per request so action + service double-gates share one profile load.
 */
export const requireAdmin = cache(async (): Promise<Profile> => {
  const profile = await getCurrentUserProfile();
  if (!profile || !canAccessAdmin(profile.role) || !profile.is_active) {
    throw new Error("Unauthorized");
  }
  return profile;
});
