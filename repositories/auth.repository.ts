import {
  createSupabaseServerComponentClient,
  createSupabaseServerActionClient,
} from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Get the current authenticated user from a Server Component context.
 * Uses the server component client (read-only cookies).
 */
export async function getCurrentAuthUserFromComponent(): Promise<User | null> {
  try {
    const client = await createSupabaseServerComponentClient();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated user from a Server Action / Route Handler context.
 * Uses the server action client (read-write cookies) so session can be refreshed.
 */
export async function getCurrentAuthUserFromAction(): Promise<User | null> {
  try {
    const client = await createSupabaseServerActionClient();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

// Note: client-side auth helpers (signIn, signUp, signOut) live in
// `auth.client.repository.ts` to keep this file server-only.
