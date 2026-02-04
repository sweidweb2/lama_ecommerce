import { ProfileHeader } from '@/components/(public)/profile/ProfileHeader'
import { ProfileStats } from '@/components/(public)/profile/ProfileStats'
import { ProfileActions } from '@/components/(public)/profile/ProfileActions'
import { ProfileOrders } from '@/components/(public)/profile/ProfileOrders'
import type { Profile } from '@/types/user'
import type { Order } from '@/types/order'

export const metadata = {
    title: 'My Profile | LAMA',
    description: 'View and manage your profile, orders, and preferences.',
}

// Dummy data
const dummyProfile: Profile = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    full_name: 'John Doe',
    role: 'user',
    created_at: '2024-01-15T10:30:00Z',
    deleted_at: null,
}

const dummyEmail = 'john.doe@example.com'

const dummyOrders: Order[] = [
    {
        id: '550e8400-e29b-41d4-a716-446655440010',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        status: 'delivered',
        subtotal: 299.99,
        shipping_fee: 15.00,
        discount: 30.00,
        total: 284.99,
        payment_status: 'paid',
        address_snapshot: null,
        phone: '+1234567890',
        email: 'john.doe@example.com',
        created_at: '2024-12-01T14:30:00Z',
        updated_at: '2024-12-05T10:00:00Z',
        deleted_at: null,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440011',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        status: 'shipped',
        subtotal: 149.99,
        shipping_fee: 10.00,
        discount: 0,
        total: 159.99,
        payment_status: 'paid',
        address_snapshot: null,
        phone: '+1234567890',
        email: 'john.doe@example.com',
        created_at: '2024-11-25T09:15:00Z',
        updated_at: '2024-11-28T16:45:00Z',
        deleted_at: null,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440012',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        status: 'processing',
        subtotal: 89.99,
        shipping_fee: 8.00,
        discount: 10.00,
        total: 87.99,
        payment_status: 'paid',
        address_snapshot: null,
        phone: '+1234567890',
        email: 'john.doe@example.com',
        created_at: '2024-11-20T11:20:00Z',
        updated_at: '2024-11-20T11:25:00Z',
        deleted_at: null,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440013',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        status: 'pending',
        subtotal: 199.99,
        shipping_fee: 12.00,
        discount: 0,
        total: 211.99,
        payment_status: 'pending',
        address_snapshot: null,
        phone: '+1234567890',
        email: 'john.doe@example.com',
        created_at: '2024-11-18T15:45:00Z',
        updated_at: '2024-11-18T15:45:00Z',
        deleted_at: null,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440014',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        status: 'packed',
        subtotal: 79.99,
        shipping_fee: 9.00,
        discount: 5.00,
        total: 83.99,
        payment_status: 'paid',
        address_snapshot: null,
        phone: '+1234567890',
        email: 'john.doe@example.com',
        created_at: '2024-11-15T08:30:00Z',
        updated_at: '2024-11-17T14:20:00Z',
        deleted_at: null,
    },
]

const dummyOrderCount = 12
const dummyWishlistCount = 8

export default function ProfilePage() {
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
                <ProfileOrders orders={dummyOrders} />
            </div>
        </div>
    )
}

