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
  const supabase = (await createSupabaseServerComponentClient()) as any;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // In a real app you might want to log this with a proper logger
    console.error("Failed to fetch profile by user_id:", error);
    return null;
  }

  return data as Profile | null;
}

