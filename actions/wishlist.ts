'use server'

import { cookies } from 'next/headers'
import { getCurrentAuthUserFromAction } from '@/repositories/auth.repository'
import {
  addToWishlist,
  addToWishlistForGuest,
  removeFromWishlistByVariant,
  removeFromWishlistByVariantForGuest,
  checkIfInWishlist,
  checkIfInWishlistForGuest,
} from '@/services/wishlist.service'
import { revalidatePath } from 'next/cache'
import { createWishlistItemSchema } from '@/lib/validators/wishlist/create'

/** Cookie name for guest session identification. */
const GUEST_SESSION_COOKIE = 'guest_session_id'

/** Guest session cookie lifetime: 14 days in seconds. */
const GUEST_SESSION_MAX_AGE = 14 * 24 * 60 * 60 // 14 days

/**
 * Read the guest_session_id cookie.
 * Returns the value or null if missing / expired.
 */
async function getGuestSessionId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(GUEST_SESSION_COOKIE)?.value ?? null
}

/**
 * Set (or refresh) the guest_session_id cookie.
 * HttpOnly, Secure, SameSite=Lax, 14-day expiry.
 */
async function setGuestSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(GUEST_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: GUEST_SESSION_MAX_AGE,
    path: '/',
  })
}

/**
 * Toggle wishlist item action.
 * This is the server action called from client components.
 * 
 * Flow:
 * 1. Validate input
 * 2. Check if user is authenticated
 * 3a. Authenticated → use existing wishlist services (user_id based)
 * 3b. Guest →
 *     - Read guest_session_id cookie
 *     - If missing → generate new session ID (crypto.randomUUID())
 *     - Set / refresh the cookie (14 days, HttpOnly, Secure, SameSite=Lax)
 *     - Check if item is in wishlist
 *     - Toggle (add if not present, remove if present)
 */
export async function toggleWishlistAction(customisedProductId: string) {
  // Validate input
  const validation = createWishlistItemSchema.safeParse({
    customised_product_id: customisedProductId,
  })

  if (!validation.success) {
    return {
      success: false,
      error: 'Invalid product variant ID',
    }
  }

  // Check if user is authenticated
  const user = await getCurrentAuthUserFromAction()

  if (user) {
    // ── Authenticated user flow ──
    const inWishlist = await checkIfInWishlist(user.id, customisedProductId)
    const result = inWishlist
      ? await removeFromWishlistByVariant(user.id, customisedProductId)
      : await addToWishlist(user.id, customisedProductId)

    if (result.success) {
      revalidatePath('/wishlist')
      revalidatePath('/products')
    }

    return result
  }

  // ── Guest user flow ──

  // Read existing session cookie (null when missing or expired)
  let sessionId = await getGuestSessionId()

  if (!sessionId) {
    // Generate a fresh session ID – never reuse old / deleted sessions
    sessionId = crypto.randomUUID()
  }

  // Always set / refresh the cookie so expiry slides forward
  await setGuestSessionCookie(sessionId)

  // Check if item is in wishlist
  const inWishlist = await checkIfInWishlistForGuest(sessionId, customisedProductId)
  
  // Toggle wishlist item
  const result = inWishlist
    ? await removeFromWishlistByVariantForGuest(sessionId, customisedProductId)
    : await addToWishlistForGuest(sessionId, customisedProductId)

  if (result.success) {
    revalidatePath('/wishlist')
    revalidatePath('/products')
  }

  return result
}

/**
 * Check if a product variant is in the wishlist (for authenticated users or guests).
 */
export async function checkWishlistStatusAction(customisedProductId: string): Promise<{
  success: boolean
  inWishlist: boolean
  error?: string
}> {
  // Validate input
  const validation = createWishlistItemSchema.safeParse({
    customised_product_id: customisedProductId,
  })

  if (!validation.success) {
    return {
      success: false,
      inWishlist: false,
      error: 'Invalid product variant ID',
    }
  }

  // Check if user is authenticated
  const user = await getCurrentAuthUserFromAction()

  if (user) {
    // ── Authenticated user flow ──
    const inWishlist = await checkIfInWishlist(user.id, customisedProductId)
    return { success: true, inWishlist }
  }

  // ── Guest user flow ──
  const sessionId = await getGuestSessionId()
  if (!sessionId) {
    return { success: true, inWishlist: false }
  }

  const inWishlist = await checkIfInWishlistForGuest(sessionId, customisedProductId)
  return { success: true, inWishlist }
}
