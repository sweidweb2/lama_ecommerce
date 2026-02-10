import {
  createSupabaseServerComponentClient,
  createSupabaseServerActionClient,
} from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase/client";
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

/**
 * Sign in with email and password (client-side only).
 * Supabase must set cookies in the browser.
 */
export async function signInWithPassword(credentials: {
  email: string;
  password: string;
}) {
  return supabase.auth.signInWithPassword(credentials);
}

/**
 * Sign up a new user (client-side only).
 */
export async function signUp(options: {
  email: string;
  password: string;
  options?: { data?: Record<string, unknown>; emailRedirectTo?: string };
}) {
  return supabase.auth.signUp({
    email: options.email,
    password: options.password,
    options: options.options,
  });
}

/**
 * Sign out the current user (client-side only).
 */
export async function signOut() {
  return supabase.auth.signOut();
}
