"use server";

import { cookies } from "next/headers";
import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import { trackProductViewService } from "@/services/product_view.service";

/** Cookie name for guest session identification. */
const GUEST_SESSION_COOKIE = "guest_session_id";

/** Guest session cookie lifetime: 14 days in seconds. */
const GUEST_SESSION_MAX_AGE = 14 * 24 * 60 * 60; // 14 days

/**
 * Read the guest_session_id cookie.
 * Returns the value or null if missing / expired.
 */
async function getGuestSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_SESSION_COOKIE)?.value ?? null;
}

/**
 * Generate a new guest session ID.
 */
function generateGuestSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Set (or refresh) the guest_session_id cookie.
 * HttpOnly, Secure, SameSite=Lax, 14-day expiry.
 */
async function setGuestSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: GUEST_SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Track a product view.
 * For authenticated users: uses user_id
 * For guests: uses session_id (from cookie or generates new one)
 */
export async function trackProductViewAction(
  productId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user
    const user = await getCurrentAuthUserFromAction();

    let userId: string | null = null;
    let sessionId: string | null = null;

    if (user) {
      // Authenticated user
      userId = user.id;
    } else {
      // Guest user - get or create session ID
      sessionId = await getGuestSessionId();
      if (!sessionId) {
        sessionId = generateGuestSessionId();
        await setGuestSessionCookie(sessionId);
      }
    }

    // Track the view
    const result = await trackProductViewService(productId, userId, sessionId);

    // Note: We don't revalidate here because this action is called during render.
    // The stats will be updated on the next page load or when explicitly revalidated.

    return result;
  } catch (error) {
    console.error("Error in trackProductViewAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to track product view",
    };
  }
}
