import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrderDetailsBreadcrumbs } from '@/components/admin/order/OrderDetailsBreadcrumbs'
import { EditOrderDialog, type AdminOrder } from '@/components/admin/order/edit_form'
import { DeleteOrderDialog } from '@/components/admin/order/delete_dialog'
import { OrderItemsTable } from '@/components/admin/order/OrderItemsTable'
import { formatPrice, formatDate } from '@/lib/utils'
import type { OrderItem, Payment, Shipment } from '@/types/order'
import {
  Package,
  CreditCard,
  Truck,
  MapPin,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react'

interface OrderDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

// Dummy users for display
const DUMMY_USERS = [
  { id: "1", name: "John Doe", email: "john.doe@example.com" },
  { id: "2", name: "Jane Smith", email: "jane.smith@example.com" },
  { id: "3", name: "Bob Johnson", email: "bob.johnson@example.com" },
  { id: "4", name: "Alice Williams", email: "alice.williams@example.com" },
  { id: "5", name: "Charlie Brown", email: "charlie.brown@example.com" },
]

const getStatusVariant = (status: string) => {
  switch (status) {
    case "delivered":
    case "paid":
      return "default"
    case "pending":
    case "processing":
    case "packed":
      return "secondary"
    case "shipped":
      return "default"
    case "cancelled":
    case "failed":
      return "destructive"
    case "returned":
    case "refunded":
      return "outline"
    default:
      return "secondary"
  }
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params

  // Dummy order data - in a real app, fetch from database
  const order: AdminOrder = {
    id: id,
    user_id: "1",
    session_id: null,
    status: "delivered",
    subtotal: 299.99,
    shipping_fee: 15.0,
    discount: 30.0,
    total: 284.99,
    payment_status: "paid",
    address_snapshot: {
      country: "United States",
      city: "New York",
      address: "123 Main Street, Apt 4B",
      postal_code: "10001",
    },
    phone: "+1234567890",
    email: "john.doe@example.com",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    deleted_at: null,
    userName: "John Doe",
  }

  // Dummy order items - in a real app, fetch from database
  const orderItems: OrderItem[] = [
    {
      id: "order-item-1",
      order_id: id,
      customised_product_id: "variant-1",
      quantity: 2,
      price_snapshot: 99.99,
      product_name_snapshot: "Tech Pro Station",
      size_snapshot: "M",
      material_snapshot: "Cotton",
      color_snapshot: "Black",
      created_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: "order-item-2",
      order_id: id,
      customised_product_id: "variant-2",
      quantity: 1,
      price_snapshot: 299.99,
      product_name_snapshot: "Wireless Headphones",
      size_snapshot: "L",
      material_snapshot: "Plastic",
      color_snapshot: "White",
      created_at: new Date().toISOString(),
      deleted_at: null,
    },
  ]

  // Dummy payment data - in a real app, fetch from database
  const payment: Payment = {
    id: "payment-1",
    order_id: id,
    status: "paid",
    transaction_id: "TXN-123456789",
    paid_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 284.99,
    currency: "USD",
    gateway: "stripe",
    payment_method: "credit_card",
    payment_url: null,
    callback_payload: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    deleted_at: null,
  }

  // Dummy shipment data - in a real app, fetch from database
  const shipment: Shipment = {
    id: "shipment-1",
    order_id: id,
    carrier_name: "FedEx",
    tracking_number: "FX1234567890",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    deleted_at: null,
  }

  const user = order.user_id ? DUMMY_USERS.find((u) => u.id === order.user_id) : null
  const address = order.address_snapshot as {
    country?: string
    city?: string
    address?: string
    postal_code?: string
  } | null

  return (
    <div>
      <OrderDetailsBreadcrumbs orderId={order.id} />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Order Details</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              View and manage order information
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/orders/${order.id}/order_payment`}>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Order
              </Button>
            </Link>
            <EditOrderDialog order={order} showText />
            <DeleteOrderDialog order={order} showText />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderItemsTable orderId={order.id} items={orderItems} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Information */}
          <div className="space-y-6">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Order ID</label>
                  <p className="text-sm font-mono mt-1">{order.id}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">User</label>
                  {user ? (
                    <div className="mt-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  ) : order.user_id ? (
                    <p className="text-sm mt-1">User ID: {order.user_id}</p>
                  ) : (
                    <p className="text-sm mt-1 text-muted-foreground">Guest</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment</label>
                    <div className="mt-1">
                      <Badge variant={getStatusVariant(order.payment_status)}>
                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </label>
                  <p className="text-sm mt-1">{order.phone || "—"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <p className="text-sm mt-1">{order.email || "—"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created At
                  </label>
                  <p className="text-sm mt-1">
                    {order.created_at ? formatDate(order.created_at) : "—"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Updated At
                  </label>
                  <p className="text-sm mt-1">
                    {order.updated_at ? formatDate(order.updated_at) : "—"}
                  </p>
                </div>

                {order.deleted_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Deleted At</label>
                    <p className="text-sm mt-1">
                      {formatDate(order.deleted_at)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {address.address && <p className="text-sm">{address.address}</p>}
                  <p className="text-sm text-muted-foreground">
                    {[address.city, address.postal_code, address.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(order.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping Fee</span>
                  <span className="font-medium">{formatPrice(order.shipping_fee || 0)}</span>
                </div>
                {order.discount && order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-green-600">-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">{formatPrice(order.total || 0)}</span>
                </div>
                {payment.transaction_id && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Transaction ID</p>
                    <p className="text-sm font-mono">{payment.transaction_id}</p>
                  </div>
                )}
                {payment.payment_method && (
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Method</p>
                    <p className="text-sm capitalize">{payment.payment_method.replace('_', ' ')}</p>
                  </div>
                )}
                {payment.gateway && (
                  <div>
                    <p className="text-xs text-muted-foreground">Gateway</p>
                    <p className="text-sm capitalize">{payment.gateway}</p>
                  </div>
                )}
                {payment.paid_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">Paid At</p>
                    <p className="text-sm">{formatDate(payment.paid_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipment Information */}
            {shipment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {shipment.carrier_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Carrier</p>
                      <p className="text-sm font-medium">{shipment.carrier_name}</p>
                    </div>
                  )}
                  {shipment.tracking_number && (
                    <div>
                      <p className="text-xs text-muted-foreground">Tracking Number</p>
                      <p className="text-sm font-mono">{shipment.tracking_number}</p>
                    </div>
                  )}
                  {shipment.created_at && (
                    <div>
                      <p className="text-xs text-muted-foreground">Shipped At</p>
                      <p className="text-sm">{formatDate(shipment.created_at)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
