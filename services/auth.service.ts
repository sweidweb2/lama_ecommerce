/**
 * Client-side authentication service.
 *
 * Auth operations must run in the browser so Supabase can set cookies.
 * All Supabase access is delegated to the auth repository.
 */

import {
  signInWithPassword as repoSignIn,
  signUp as repoSignUp,
  signOut as repoSignOut,
} from "@/repositories/auth.repository";
import type { LoginInput, SignupInput } from "@/lib/validators/auth/auth";
import { ROUTES } from "@/lib/constants/routes";

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: any;
}

export interface SignupResult {
  success: boolean;
  error?: string;
  user?: any;
  requiresEmailVerification: boolean;
}

/**
 * Sign in with email and password. Call from a client component.
 */
export async function loginService(
  credentials: LoginInput,
): Promise<LoginResult> {
  try {
    const { data, error } = await repoSignIn({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });

    if (error) {
      let errorMessage = error.message;
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please verify your email address before signing in.";
      }
      return { success: false, error: errorMessage };
    }

    return { success: true, user: data.user };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Sign up a new user. Call from a client component.
 */
export async function signupService(
  data: SignupInput,
): Promise<SignupResult> {
  try {
    const { data: authData, error } = await repoSignUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        data: { full_name: data.name.trim() },
        emailRedirectTo: `${window.location.origin}${ROUTES.CALLBACK}`,
      },
    });

    if (error) {
      let errorMessage = error.message;
      if (error.message.includes("User already registered")) {
        errorMessage =
          "An account with this email already exists. Please sign in instead.";
      } else if (error.message.includes("Password")) {
        errorMessage =
          "Password does not meet requirements. Please choose a stronger password.";
      }
      return {
        success: false,
        error: errorMessage,
        requiresEmailVerification: false,
      };
    }

    const requiresEmailVerification = !!(
      authData.user && !authData.session
    );

    return {
      success: true,
      user: authData.user,
      requiresEmailVerification,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
      requiresEmailVerification: false,
    };
  }
}

/**
 * Sign out the current user. Call from a client component.
 */
export async function logoutService(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await repoSignOut();
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
