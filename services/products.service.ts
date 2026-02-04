import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { ProductWithRelations, Category } from '@/types/product'

export interface GetProductsParams {
  categorySlug?: string
  sort?: string
  page?: number
  pageSize?: number
  search?: string
}

export async function getProducts(
  supabase: SupabaseClient<Database>,
  params: GetProductsParams = {}
): Promise<{ data: ProductWithRelations[]; count: number }> {
  const { categorySlug, sort, page = 1, pageSize = 12, search } = params

  let query = supabase
    .from('products')
    .select('*, brand:brands(*), category:categories(*), images:product_images(*)', { count: 'exact' })
    .eq('is_active', true)

  if (categorySlug) {
    // We need to fetch the category ID first if we only have the slug
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()
    
    if (category) {
      query = query.eq('category_id', (category as any).id)
    }
  }

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  // Sorting
  if (sort) {
    const [field, order] = sort.split('-')
    query = query.order(field, { ascending: order === 'asc' })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    // This is expected if products table doesn't exist or Supabase isn't configured
    // The page will fall back to dummy data
    return { data: [], count: 0 }
  }

  return { data: data as ProductWithRelations[], count: count || 0 }
}

export async function getProductBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<ProductWithRelations | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, brand:brands(*), category:categories(*), images:product_images(*), variants:product_variants(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching product by slug:', error)
    return null
  }

  return data as ProductWithRelations
}
