import { supabase } from "@/lib/supabase/client";

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

/**
 * Update the current user's password (client-side only).
 * User must be logged in. Supabase may require re-auth depending on config.
 */
export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

