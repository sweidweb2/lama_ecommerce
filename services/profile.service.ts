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
      // Silently return null for unauthenticated users (not an error)
      // Only log actual errors (network issues, etc.)
      if (error.message !== "Invalid JWT" && error.message !== "JWT expired") {
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

