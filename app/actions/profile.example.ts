"use server";

/**
 * Example: Server action using canEditProfile helper
 * 
 * This demonstrates how to use canEditProfile() in server actions
 * to protect profile update operations.
 * 
 * Usage:
 * 
 * import { updateProfile } from "@/app/actions/profile";
 * 
 * // In a Server Component or Server Action:
 * await updateProfile(profileId, { full_name: "New Name" });
 */

import { getCurrentUserProfile } from "@/lib/services/profile.service";
import { canEditProfile } from "@/lib/auth/permissions";

interface UpdateProfileData {
  full_name?: string;
  // ... other profile fields
}

/**
 * Example: Update a user profile
 * 
 * This server action checks if the user owns the profile before
 * allowing the update operation.
 */
export async function updateProfile(
  profileId: string,
  data: UpdateProfileData
) {
  // Get current user profile
  const profile = await getCurrentUserProfile();

  if (!profile) {
    throw new Error("Unauthorized: Must be logged in");
  }

  // Check if user can edit this profile using permission helper
  if (!canEditProfile(profileId, profile.user_id)) {
    throw new Error("Unauthorized: You can only edit your own profile");
  }

  // Proceed with profile update
  // ... your update logic here ...
  
  return { success: true, message: "Profile updated successfully" };
}
