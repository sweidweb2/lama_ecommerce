import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { Order } from '@/types/order'

/**
 * Get orders for a specific user.
 * Returns orders ordered by created_at descending (newest first).
 */
export async function getUserOrders(
    supabase: SupabaseClient<Database>,
    userId: string,
    limit?: number
): Promise<Order[]> {
    try {
        let query = (supabase
            .from('orders' as any) as any)
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })

        if (limit) {
            query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching user orders:', error)
            return []
        }

        return (data as Order[]) || []
    } catch (error) {
        console.error('Unexpected error in getUserOrders:', error)
        return []
    }
}

/**
 * Get order count for a specific user.
 */
export async function getUserOrderCount(
    supabase: SupabaseClient<Database>,
    userId: string
): Promise<number> {
    try {
        const { count, error } = await (supabase
            .from('orders' as any) as any)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .is('deleted_at', null)

        if (error) {
            console.error('Error fetching user order count:', error)
            return 0
        }

        return count || 0
    } catch (error) {
        console.error('Unexpected error in getUserOrderCount:', error)
        return 0
    }
}

