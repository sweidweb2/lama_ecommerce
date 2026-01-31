"use server";

import { getCurrentUserProfile } from "@/services/profile.service";

/**
 * Server action to get the current user's profile.
 * Can be called from Client Components.
 */
export async function getProfile() {
  return await getCurrentUserProfile();
}
