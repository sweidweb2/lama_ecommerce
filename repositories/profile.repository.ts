import {
  createSupabaseServerComponentClient,
  createSupabaseServerActionClient,
} from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Profile, ProfileRole } from "@/types/user";

/** Profile row with email (from get_admin_profiles() RPC). */
export interface AdminProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  role: ProfileRole;
  created_at: string;
  is_active: boolean;
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
  userId: string,
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
  supabase: Awaited<ReturnType<typeof createSupabaseServerComponentClient>>,
): Promise<AdminProfileRow[]> {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("id, user_id, full_name, role, created_at, is_active");

  if (error) return [];
  return (data ?? []).map((row: Omit<AdminProfileRow, "email">) => ({
    ...row,
    email: null,
  })) as AdminProfileRow[];
}

/**
 * Update a profile by id (admin use). Updates full_name, role, and/or is_active (status).
 * Caller must be admin (enforced by RLS).
 */
export async function updateProfileById(
  profileId: string,
  updates: {
    full_name?: string | null;
    role?: ProfileRole;
    is_active?: boolean;
  },
): Promise<Profile | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const payload: Record<string, unknown> = {};
    if (updates.full_name !== undefined) payload.full_name = updates.full_name;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.is_active !== undefined) payload.is_active = updates.is_active;

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

export type CreateUserAndProfileResult =
  | { ok: true; profile: Profile; user_id: string }
  | { ok: false; error: string };

/**
 * Create a new auth user and profile using the service role (admin only).
 * Caller must have verified admin role before calling.
 */
export async function createUserAndProfile(params: {
  email: string;
  password: string;
  full_name: string;
  role: ProfileRole;
  is_active: boolean;
}): Promise<CreateUserAndProfileResult> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: authData, error: authError } = await (supabase as any).auth.admin.createUser({
      email: params.email.trim().toLowerCase(),
      password: params.password,
      email_confirm: true,
      user_metadata: { full_name: params.full_name.trim() },
    });

    if (authError) {
      console.error("Admin createUser failed:", authError);
      const msg = authError.message ?? "User creation failed";
      return { ok: false, error: msg };
    }

    const userId = authData.user?.id;
    if (!userId) {
      console.error("Admin createUser returned no user id");
      return { ok: false, error: "User creation failed" };
    }

    const adminSupabase = supabase as any;
    const { data: existing } = await adminSupabase
      .from("profiles")
      .select("id, user_id, full_name, role, created_at, is_active")
      .eq("user_id", userId)
      .maybeSingle();

    let profileRow: Profile;

    if (existing) {
      const { data: updated, error: updateError } = await adminSupabase
        .from("profiles")
        .update({
          full_name: params.full_name.trim(),
          role: params.role,
          is_active: params.is_active,
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (updateError) {
        console.error("Update profile failed:", updateError);
        return { ok: false, error: "Failed to update profile" };
      }
      profileRow = updated as Profile;
    } else {
      const { data: inserted, error: insertError } = await adminSupabase
        .from("profiles")
        .insert({
          user_id: userId,
          full_name: params.full_name.trim(),
          role: params.role,
          is_active: params.is_active,
        })
        .select()
        .single();
      if (insertError) {
        console.error("Insert profile failed:", insertError);
        return { ok: false, error: "Failed to create profile" };
      }
      profileRow = inserted as Profile;
    }

    return { ok: true, profile: profileRow, user_id: userId };
  } catch (error) {
    console.error("Unexpected error in createUserAndProfile:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "User creation failed",
    };
  }
}
