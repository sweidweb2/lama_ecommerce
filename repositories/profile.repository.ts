import {
  createSupabaseServerComponentClient,
  createSupabaseServerActionClient,
} from "@/lib/supabase/server";
import type { Profile, ProfileRole } from "@/types/user";

/** Profile row with email (from get_admin_profiles() RPC). */
export interface AdminProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  role: ProfileRole;
  created_at: string;
  deleted_at: string | null;
  email: string | null;
}

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
      if (
        !error.message.includes("permission denied") &&
        !error.message.includes("RLS")
      ) {
        console.error("Failed to fetch profile by user_id:", error);
      }
      return null;
    }

    return data as Profile | null;
  } catch (error) {
    console.error("Unexpected error in getProfileByUserId:", error);
    return null;
  }
}

/**
 * Fetch all profiles with email for admin (uses get_admin_profiles() RPC).
 * RLS / function enforces admin-only access.
 * If RPC fails (e.g. migration not applied), falls back to selecting profiles
 * without email so the admin table still works.
 */
export async function getAllProfilesForAdmin(): Promise<AdminProfileRow[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await (supabase as any).rpc("get_admin_profiles");

    if (error) {
      const msg =
        typeof error?.message === "string"
          ? error.message
          : JSON.stringify(error) || String(error);
      if (!msg.includes("permission denied") && !msg.includes("RLS")) {
        console.error("Failed to fetch admin profiles:", msg);
      }
      // Fallback: fetch profiles without email (works if admin RLS policy exists)
      return getAllProfilesForAdminFallback(supabase);
    }

    return (data ?? []) as AdminProfileRow[];
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : JSON.stringify(err) || String(err);
    console.error("Unexpected error in getAllProfilesForAdmin:", msg);
    try {
      const supabase = await createSupabaseServerComponentClient();
      return getAllProfilesForAdminFallback(supabase);
    } catch {
      return [];
    }
  }
}

/**
 * Fallback when RPC is unavailable: select profiles only (no email).
 * Requires "Admins can read all profiles" RLS policy.
 */
async function getAllProfilesForAdminFallback(
  supabase: Awaited<ReturnType<typeof createSupabaseServerComponentClient>>
): Promise<AdminProfileRow[]> {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("id, user_id, full_name, role, created_at, deleted_at");

  if (error) return [];
  return (data ?? []).map((row: Omit<AdminProfileRow, "email">) => ({
    ...row,
    email: null,
  })) as AdminProfileRow[];
}

/**
 * Update a profile by id (admin use). Updates full_name, role, and/or deleted_at.
 * Caller must be admin (enforced by RLS).
 */
export async function updateProfileById(
  profileId: string,
  updates: {
    full_name?: string | null;
    role?: ProfileRole;
    deleted_at?: string | null;
  }
): Promise<Profile | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const payload: Record<string, unknown> = {};
    if (updates.full_name !== undefined) payload.full_name = updates.full_name;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.deleted_at !== undefined) payload.deleted_at = updates.deleted_at;

    const { data, error } = await (supabase as any)
      .from("profiles")
      .update(payload)
      .eq("id", profileId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Failed to update profile:", error);
      return null;
    }
    return data as Profile | null;
  } catch (error) {
    console.error("Unexpected error in updateProfileById:", error);
    return null;
  }
}

/**
 * Soft-delete a profile by setting deleted_at (admin use).
 * Caller must be admin (enforced by RLS).
 */
export async function softDeleteProfileById(
  profileId: string
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", profileId);

    if (error) {
      console.error("Failed to soft-delete profile:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error in softDeleteProfileById:", error);
    return false;
  }
}

