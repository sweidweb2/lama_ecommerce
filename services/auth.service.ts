/**
 * Client-side authentication service.
 * 
 * Note: Auth operations must happen on the client side because Supabase
 * needs to set cookies in the browser. This is an exception to the normal
 * architecture pattern, but necessary for authentication.
 * 
 * For other operations, use the standard Component → Action → Service → Repository flow.
 */

import { supabase } from "@/lib/supabase/client";
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
 * Sign in a user with email and password.
 * This must be called from a client component.
 */
export async function loginService(
  credentials: LoginInput
): Promise<LoginResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });

    if (error) {
      // Transform error messages for better UX
      let errorMessage = error.message;
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please verify your email address before signing in.";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Sign up a new user.
 * This must be called from a client component.
 */
export async function signupService(
  data: SignupInput
): Promise<SignupResult> {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        data: {
          full_name: data.name.trim(),
        },
        emailRedirectTo: `${window.location.origin}${ROUTES.CALLBACK}`,
      },
    });

    if (error) {
      // Transform error messages for better UX
      let errorMessage = error.message;
      if (error.message.includes("User already registered")) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (error.message.includes("Password")) {
        errorMessage = "Password does not meet requirements. Please choose a stronger password.";
      }

      return {
        success: false,
        error: errorMessage,
        requiresEmailVerification: false,
      };
    }

    // Check if email verification is required
    const requiresEmailVerification = authData.user && !authData.session;

    return {
      success: true,
      user: authData.user,
      requiresEmailVerification,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      requiresEmailVerification: false,
    };
  }
}

/**
 * Sign out the current user.
 * This must be called from a client component.
 */
export async function logoutService(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
