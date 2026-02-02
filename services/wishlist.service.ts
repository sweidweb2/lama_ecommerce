import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { ProductWithRelations } from '@/types/product_utf8'

export async function getWishlistItems(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<any[]> {
  const { data, error } = await (supabase
    .from('wishlists' as any) as any)
    .select(`
      id,
      customised_product_id,
      customised_products (
        id,
        product_id,
        color,
        size,
        material,
        products (
          id,
          name,
          slug,
          description,
          price,
          is_active,
          brand_id,
          category_id,
          brands (
            id,
            name,
            slug
          ),
          categories (
            id,
            name,
            slug
          ),
          product_images (
            id,
            url_image,
            is_primary
          )
        )
      )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching wishlist:', error)
    return []
  }

  // Transform data to a flatter structure for easier consumption
  return data.map((item: any) => {
    const productData = item.customised_products?.products;
    if (!productData) return null;

    return {
      wishlist_id: item.id,
      customised_product_id: item.customised_product_id,
      variant: {
        id: item.customised_products.id,
        color: item.customised_products.color,
        size: item.customised_products.size,
        material: item.customised_products.material,
      },
      product: {
        ...productData,
        brand: productData.brands,
        category: productData.categories,
        images: productData.product_images,
      }
    }
  }).filter(Boolean)
}

export async function addToWishlist(
  supabase: SupabaseClient<Database>,
  userId: string,
  customisedProductId: string
) {
  const { data, error } = await (supabase
    .from('wishlists' as any) as any)
    .insert({
      user_id: userId,
      customised_product_id: customisedProductId
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding to wishlist:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function removeFromWishlist(
  supabase: SupabaseClient<Database>,
  userId: string,
  wishlistId: string
) {
  const { error } = await (supabase
    .from('wishlists' as any) as any)
    .delete()
    .eq('id', wishlistId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error removing from wishlist:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function removeFromWishlistByVariant(
  supabase: SupabaseClient<Database>,
  userId: string,
  customisedProductId: string
) {
  const { error } = await (supabase
    .from('wishlists' as any) as any)
    .delete()
    .eq('user_id', userId)
    .eq('customised_product_id', customisedProductId)

  if (error) {
    console.error('Error removing from wishlist by variant:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function checkIfInWishlist(
  supabase: SupabaseClient<Database>,
  userId: string,
  customisedProductId: string
): Promise<boolean> {
  const { data, error } = await (supabase
    .from('wishlists' as any) as any)
    .select('id')
    .eq('user_id', userId)
    .eq('customised_product_id', customisedProductId)
    .maybeSingle()

  if (error) {
    console.error('Error checking wishlist status:', error)
    return false
  }

  return !!data
}
