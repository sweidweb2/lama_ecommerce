import { OrdersTable, type AdminOrder } from "@/components/admin/order/OrdersTable"
import { CreateOrderDialog } from "@/components/admin/order/create_form"

// Dummy data matching the schema
const orders: AdminOrder[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010",
    user_id: "1",
    session_id: null,
    status: "delivered",
    subtotal: 299.99,
    shipping_fee: 15.0,
    discount: 30.0,
    total: 284.99,
    payment_status: "paid",
    address_snapshot: null,
    phone: "+1234567890",
    email: "john.doe@example.com",
    created_at: "2024-12-01T14:30:00Z",
    updated_at: "2024-12-05T10:00:00Z",
    deleted_at: null,
    userName: "John Doe",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440011",
    user_id: "2",
    session_id: null,
    status: "shipped",
    subtotal: 149.99,
    shipping_fee: 10.0,
    discount: 0,
    total: 159.99,
    payment_status: "paid",
    address_snapshot: null,
    phone: "+1234567891",
    email: "jane.smith@example.com",
    created_at: "2024-11-25T09:15:00Z",
    updated_at: "2024-11-28T16:45:00Z",
    deleted_at: null,
    userName: "Jane Smith",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440012",
    user_id: "3",
    session_id: null,
    status: "processing",
    subtotal: 89.99,
    shipping_fee: 8.0,
    discount: 10.0,
    total: 87.99,
    payment_status: "paid",
    address_snapshot: null,
    phone: "+1234567892",
    email: "bob.johnson@example.com",
    created_at: "2024-11-20T11:20:00Z",
    updated_at: "2024-11-20T11:25:00Z",
    deleted_at: null,
    userName: "Bob Johnson",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440013",
    user_id: "4",
    session_id: null,
    status: "pending",
    subtotal: 199.99,
    shipping_fee: 12.0,
    discount: 0,
    total: 211.99,
    payment_status: "pending",
    address_snapshot: null,
    phone: "+1234567893",
    email: "alice.williams@example.com",
    created_at: "2024-11-18T15:45:00Z",
    updated_at: "2024-11-18T15:45:00Z",
    deleted_at: null,
    userName: "Alice Williams",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440014",
    user_id: "5",
    session_id: null,
    status: "cancelled",
    subtotal: 79.99,
    shipping_fee: 5.0,
    discount: 0,
    total: 84.99,
    payment_status: "refunded",
    address_snapshot: null,
    phone: "+1234567894",
    email: "charlie.brown@example.com",
    created_at: "2024-11-15T10:00:00Z",
    updated_at: "2024-11-16T14:30:00Z",
    deleted_at: null,
    userName: "Charlie Brown",
  },
  // Add more dummy orders to test pagination
  ...Array.from({ length: 50 }, (_, i) => ({
    id: `550e8400-e29b-41d4-a716-44665544${String(1015 + i).padStart(4, '0')}`,
    user_id: String((i % 5) + 1),
    session_id: null,
    status: (['pending', 'processing', 'packed', 'shipped', 'delivered', 'returned', 'cancelled'] as const)[i % 7],
    subtotal: 100 + i * 10,
    shipping_fee: 10 + i,
    discount: i % 3 === 0 ? 5 : 0,
    total: 100 + i * 10 + 10 + i - (i % 3 === 0 ? 5 : 0),
    payment_status: (['pending', 'paid', 'failed', 'refunded'] as const)[i % 4],
    address_snapshot: null,
    phone: `+123456789${i}`,
    email: `user${i}@example.com`,
    created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    deleted_at: null,
    userName: `User ${i + 1}`,
  })),
]

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage and track all orders
          </p>
        </div>
        <CreateOrderDialog />
      </div>

      <OrdersTable orders={orders} />
    </div>
  )
}
