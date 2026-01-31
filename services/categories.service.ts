import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { Category } from '@/types/product'

export async function getCategories(
  supabase: SupabaseClient<Database>
): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data as Category[]
}
