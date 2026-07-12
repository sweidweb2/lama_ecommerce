'use server'

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
import {
  getGuestSessionId,
  getOrCreateGuestSessionId,
} from '@/lib/auth/guest-session'

/**
 * Toggle wishlist item action.
 * This is the server action called from client components.
 *
 * Flow:
 * 1. Validate input
 * 2. Check if user is authenticated
 * 3a. Authenticated → use existing wishlist services (user_id based)
 * 3b. Guest → cookie session + guest wishlist services
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
  const sessionId = await getOrCreateGuestSessionId()

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
