import { OrdersTable } from "@/components/(public)/orders/OrdersTable";
import type { Order } from "@/types/order";

export const metadata = {
  title: "My Orders | LAMA",
  description: "View your order history and track your purchases.",
};

// Dummy order data
const dummyOrders: Order[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010",
    user_id: "550e8400-e29b-41d4-a716-446655440001",
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
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440011",
    user_id: "550e8400-e29b-41d4-a716-446655440001",
    session_id: null,
    status: "shipped",
    subtotal: 149.99,
    shipping_fee: 10.0,
    discount: 0,
    total: 159.99,
    payment_status: "paid",
    address_snapshot: null,
    phone: "+1234567890",
    email: "john.doe@example.com",
    created_at: "2024-11-25T09:15:00Z",
    updated_at: "2024-11-28T16:45:00Z",
    deleted_at: null,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440012",
    user_id: "550e8400-e29b-41d4-a716-446655440001",
    session_id: null,
    status: "processing",
    subtotal: 89.99,
    shipping_fee: 8.0,
    discount: 10.0,
    total: 87.99,
    payment_status: "paid",
    address_snapshot: null,
    phone: "+1234567890",
    email: "john.doe@example.com",
    created_at: "2024-11-20T11:20:00Z",
    updated_at: "2024-11-20T11:25:00Z",
    deleted_at: null,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440013",
    user_id: "550e8400-e29b-41d4-a716-446655440001",
    session_id: null,
    status: "pending",
    subtotal: 199.99,
    shipping_fee: 12.0,
    discount: 0,
    total: 211.99,
    payment_status: "pending",
    address_snapshot: null,
    phone: "+1234567890",
    email: "john.doe@example.com",
    created_at: "2024-11-18T15:45:00Z",
    updated_at: "2024-11-18T15:45:00Z",
    deleted_at: null,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440014",
    user_id: "550e8400-e29b-41d4-a716-446655440001",
    session_id: null,
    status: "packed",
    subtotal: 79.99,
    shipping_fee: 9.0,
    discount: 5.0,
    total: 83.99,
    payment_status: "paid",
    address_snapshot: null,
    phone: "+1234567890",
    email: "john.doe@example.com",
    created_at: "2024-11-15T08:30:00Z",
    updated_at: "2024-11-17T14:20:00Z",
    deleted_at: null,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440015",
    user_id: "550e8400-e29b-41d4-a716-446655440001",
    session_id: null,
    status: "cancelled",
    subtotal: 129.99,
    shipping_fee: 10.0,
    discount: 0,
    total: 139.99,
    payment_status: "refunded",
    address_snapshot: null,
    phone: "+1234567890",
    email: "john.doe@example.com",
    created_at: "2024-11-10T10:00:00Z",
    updated_at: "2024-11-12T09:30:00Z",
    deleted_at: null,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440016",
    user_id: "550e8400-e29b-41d4-a716-446655440001",
    session_id: null,
    status: "returned",
    subtotal: 249.99,
    shipping_fee: 15.0,
    discount: 20.0,
    total: 244.99,
    payment_status: "refunded",
    address_snapshot: null,
    phone: "+1234567890",
    email: "john.doe@example.com",
    created_at: "2024-11-05T12:00:00Z",
    updated_at: "2024-11-08T16:00:00Z",
    deleted_at: null,
  },
];


export default function OrdersPage() {
  return (
    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 lg:py-20 xl:py-24">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          My Orders
        </h1>
        <p className="text-muted-foreground mt-2">
          View and track all your orders.
        </p>
      </div>

      <OrdersTable orders={dummyOrders} />
    </div>
  );
}
