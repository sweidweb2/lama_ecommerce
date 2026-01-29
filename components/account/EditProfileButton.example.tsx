"use client";

/**
 * Example: Client component using canEditProfile helper
 * 
 * This demonstrates how to use canEditProfile() in a client component
 * to conditionally show/hide edit buttons based on ownership.
 * 
 * Usage:
 * 
 * import { EditProfileButton } from "@/components/account/EditProfileButton";
 * 
 * <EditProfileButton profileId={profile.id} />
 */

import { useAuth } from "@/providers/AuthProvider";
import { canEditProfile } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";

interface EditProfileButtonProps {
  profileId: string;
}

export function EditProfileButton({ profileId }: EditProfileButtonProps) {
  const { user } = useAuth();

  // Use permission helper to check if current user can edit this profile
  if (!canEditProfile(profileId, user?.id)) {
    // Hide edit button if user doesn't own this profile
    return null;
  }

  // Show edit button only if user owns the profile
  return (
    <Button
      onClick={() => {
        // Navigate to edit page or open edit modal
        window.location.href = `/account/profile/edit`;
      }}
    >
      Edit Profile
    </Button>
  );
}
