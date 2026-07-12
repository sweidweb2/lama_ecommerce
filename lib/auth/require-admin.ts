import { canAccessAdmin } from "@/lib/auth/permissions";
import { getCurrentUserProfile } from "@/services/profile.service";
import type { Profile } from "@/types/user";

/**
 * Ensure the current user is an authenticated admin.
 * Throws "Unauthorized" if not — same pattern as admin product actions.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentUserProfile();
  if (!profile || !canAccessAdmin(profile.role)) {
    throw new Error("Unauthorized");
  }
  return profile;
}
