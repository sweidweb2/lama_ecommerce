'use server'

import { getCurrentAuthUserFromAction } from '@/repositories/auth.repository'
import {
  addToWishlist,
  removeFromWishlistByVariant,
  checkIfInWishlist,
} from '@/services/wishlist.service'
import { revalidatePath } from 'next/cache'

export async function toggleWishlistAction(customisedProductId: string) {
  const user = await getCurrentAuthUserFromAction()
  if (!user) {
    return { success: false, error: 'You must be logged in to manage your wishlist' }
  }

  const inWishlist = await checkIfInWishlist(user.id, customisedProductId)
  const result = inWishlist
    ? await removeFromWishlistByVariant(user.id, customisedProductId)
    : await addToWishlist(user.id, customisedProductId)

  if (result.success) {
    revalidatePath('/wishlist')
    // We also revalidate products since they might show the wishlist status
    revalidatePath('/products')
  }

  return result
}
