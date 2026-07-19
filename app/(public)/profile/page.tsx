import { ProfileHeader } from '@/components/(public)/profile/ProfileHeader'
import { ProfileStats } from '@/components/(public)/profile/ProfileStats'
import { ProfileActions } from '@/components/(public)/profile/ProfileActions'
import { ProfileOrders } from '@/components/(public)/profile/ProfileOrders'
import { getCurrentAuthUserFromComponent } from '@/repositories/auth.repository'
import { getUserOrders } from '@/services/order.service'
import { encryptOrderId } from '@/lib/utils/encryption'
import type { Profile } from '@/types/user'

export const metadata = {
    title: 'My Profile',
    description: 'View and manage your profile, orders, and preferences.',
}

// Dummy data (header / stats only — orders are real)
const dummyProfile: Profile = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    full_name: 'John Doe',
    role: 'user',
    created_at: '2024-01-15T10:30:00Z',
    is_active: true,
}

const dummyEmail = 'john.doe@example.com'

const dummyOrderCount = 12
const dummyWishlistCount = 8

export default async function ProfilePage() {
    const user = await getCurrentAuthUserFromComponent()
    const orders = user ? await getUserOrders(user.id, 6) : []
    const ordersWithEncryptedIds = orders.map((order) => ({
        ...order,
        encryptedId: encryptOrderId(order.id),
    }))

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-10">
                <h1 className="text-4xl font-black tracking-tight text-foreground">
                    My Profile
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account, view orders, and update your preferences.
                </p>
            </div>

            <div className="space-y-8">
                {/* Profile Header */}
                <ProfileHeader profile={dummyProfile} email={dummyEmail} />

                {/* Stats */}
                <ProfileStats
                    orderCount={dummyOrderCount}
                    wishlistCount={dummyWishlistCount}
                />

                {/* Quick Actions */}
                <ProfileActions />

                {/* Recent Orders */}
                <ProfileOrders orders={ordersWithEncryptedIds} />
            </div>
        </div>
    )
}
