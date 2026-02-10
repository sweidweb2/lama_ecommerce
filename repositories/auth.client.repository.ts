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

