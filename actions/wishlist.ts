'use server'

import { createSupabaseServerActionClient } from '@/lib/supabase/server'
import { 
  addToWishlist, 
  removeFromWishlistByVariant, 
  checkIfInWishlist 
} from '@/services/wishlist.service'
import { revalidatePath } from 'next/cache'

export async function toggleWishlistAction(customisedProductId: string) {
  const supabase = await createSupabaseServerActionClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'You must be logged in to manage your wishlist' }
  }

  const isInWishlist = await checkIfInWishlist(supabase, user.id, customisedProductId)

  let result
  if (isInWishlist) {
    result = await removeFromWishlistByVariant(supabase, user.id, customisedProductId)
  } else {
    result = await addToWishlist(supabase, user.id, customisedProductId)
  }

  if (result.success) {
    revalidatePath('/wishlist')
    // We also revalidate products since they might show the wishlist status
    revalidatePath('/products')
  }

  return result
}
