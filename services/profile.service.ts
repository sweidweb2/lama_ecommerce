import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import type { Profile, ProfileRole } from "@/types/user";
import { getProfileByUserId } from "@/repositories/profile.repository";

/**
 * Get the current authenticated user's profile (including `role`).
 *
 * - Uses the server Supabase client to fetch the current auth user.
 * - If no user is authenticated, returns `null`.
 * - Otherwise loads the profile for `user.id` from `public.profiles`.
 * 
 * Note: Uses Server Component client (read-only cookies) to work in Server Components.
 * For Server Actions/Route Handlers that need to modify cookies, use createSupabaseServerActionClient directly.
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  try {
    const supabase = await createSupabaseServerComponentClient();

    if (!supabase) {
      return null;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // Silently return null for common unauthenticated states
      const silentErrors = [
        "Invalid JWT", 
        "JWT expired", 
        "Refresh Token Not Found",
        "refresh_token_not_found"
      ];
      
      if (!silentErrors.some(msg => error.message.includes(msg))) {
        console.error("Failed to fetch current auth user:", error);
      }
      return null;
    }

    if (!user) {
      return null;
    }

    const profile = await getProfileByUserId(user.id);

    if (!profile) {
      return null;
    }

    // Ensure `role` is present and correctly typed as `ProfileRole`.
    const role = profile.role as ProfileRole;

    return {
      ...profile,
      role,
    };
  } catch (error) {
    // Catch any unexpected errors and return null gracefully
    console.error("Unexpected error in getCurrentUserProfile:", error);
    return null;
  }
}

