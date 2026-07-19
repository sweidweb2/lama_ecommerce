'use server'

import { z } from 'zod'
import { getCurrentAuthUserFromAction } from '@/repositories/auth.repository'
import {
  removeFromWishlist,
  removeFromWishlistForGuest,
  checkIfInWishlist,
  checkIfInWishlistForGuest,
  getWishlistCount,
  getWishlistCountForGuest,
  toggleWishlistForUser,
  toggleWishlistForGuest,
} from '@/services/wishlist.service'
import { revalidatePath } from 'next/cache'
import { createWishlistItemSchema } from '@/lib/validators/wishlist/create'
import {
  getGuestSessionId,
  getOrCreateGuestSessionId,
} from '@/lib/auth/guest-session'

const wishlistIdSchema = z.string().uuid()

/**
 * Toggle wishlist item action.
 * Resolves caller identity, then delegates toggle rules to the service.
 */
export async function toggleWishlistAction(customisedProductId: string) {
  const validation = createWishlistItemSchema.safeParse({
    customised_product_id: customisedProductId,
  })

  if (!validation.success) {
    return {
      success: false,
      error: 'Invalid product variant ID',
    }
  }

  const user = await getCurrentAuthUserFromAction()

  const result = user
    ? await toggleWishlistForUser(user.id, validation.data.customised_product_id)
    : await toggleWishlistForGuest(
        await getOrCreateGuestSessionId(),
        validation.data.customised_product_id,
      )

  if (result.success) {
    revalidatePath('/wishlist')
    revalidatePath('/account/wishlist')
    revalidatePath('/products')
  }

  return result
}

/**
 * Remove a wishlist row by id (list page). Auth or guest cookie.
 */
export async function removeWishlistItemAction(wishlistId: string) {
  const parsed = wishlistIdSchema.safeParse(wishlistId)
  if (!parsed.success) {
    return { success: false as const, error: 'Invalid wishlist item' }
  }

  const user = await getCurrentAuthUserFromAction()

  if (user) {
    const result = await removeFromWishlist(user.id, parsed.data)
    if (result.success) {
      revalidatePath('/wishlist')
      revalidatePath('/account/wishlist')
    }
    return result
  }

  const sessionId = await getGuestSessionId()
  if (!sessionId) {
    return { success: false as const, error: 'No active guest session' }
  }

  const result = await removeFromWishlistForGuest(sessionId, parsed.data)
  if (result.success) {
    revalidatePath('/wishlist')
    revalidatePath('/account/wishlist')
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

  const user = await getCurrentAuthUserFromAction()

  if (user) {
    const inWishlist = await checkIfInWishlist(
      user.id,
      validation.data.customised_product_id,
    )
    return { success: true, inWishlist }
  }

  const sessionId = await getGuestSessionId()
  if (!sessionId) {
    return { success: true, inWishlist: false }
  }

  const inWishlist = await checkIfInWishlistForGuest(
    sessionId,
    validation.data.customised_product_id,
  )
  return { success: true, inWishlist }
}

/**
 * Wishlist item count for Navbar badge (auth user or guest cookie).
 */
export async function getWishlistCountAction(): Promise<number> {
  const user = await getCurrentAuthUserFromAction()
  if (user) {
    return getWishlistCount(user.id)
  }

  const sessionId = await getGuestSessionId()
  if (!sessionId) return 0

  return getWishlistCountForGuest(sessionId)
}
