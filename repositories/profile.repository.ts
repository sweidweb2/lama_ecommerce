import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/user";

/**
 * Fetch the current user profile by `user_id`.
 *
 * Uses the server Supabase client and queries `public.profiles`,
 * returning the first matching row (if any).
 * 
 * Note: Uses Server Component client (read-only cookies) to work in Server Components.
 */
export async function getProfileByUserId(
  userId: string
): Promise<Profile | null> {
  try {
    const supabase = await createSupabaseServerComponentClient();

    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      // Only log non-expected errors (network issues, etc.)
      // RLS policy denials are expected and shouldn't be logged as errors
      if (!error.message.includes("permission denied") && !error.message.includes("RLS")) {
        console.error("Failed to fetch profile by user_id:", error);
      }
      return null;
    }

    return data as Profile | null;
  } catch (error) {
    // Catch any unexpected errors
    console.error("Unexpected error in getProfileByUserId:", error);
    return null;
  }
}

