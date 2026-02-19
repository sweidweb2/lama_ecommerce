import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrderDetailsBreadcrumbs } from '@/components/admin/order/OrderDetailsBreadcrumbs'
import { EditOrderDialog, type AdminOrder } from '@/components/admin/order/edit_form'
import { DeleteOrderDialog } from '@/components/admin/order/delete_dialog'
import { OrderItemsTable } from '@/components/admin/order/OrderItemsTable'
import { formatPrice, formatDate } from '@/lib/utils'
import { decryptOrderId, encryptOrderId } from '@/lib/utils/encryption'
import type { OrderItem, Payment, Shipment } from '@/types/order'
import { getAdminOrderDetails } from '@/services/order.service'
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
  const { id: encryptedId } = await params

  // Decrypt the order ID
  let orderId: string
  try {
    orderId = decryptOrderId(encryptedId)
  } catch (error) {
    console.error('Failed to decrypt order ID:', error)
    notFound()
  }

  const details = await getAdminOrderDetails(orderId)

  if (!details) {
    notFound()
  }

  const { order, items: orderItems, payment, shipment } = details

  const address = order.address_snapshot as {
    country?: string
    city?: string
    address?: string
    postal_code?: string
  } | null

  const isDeleted = !!order.deleted_at

  return (
    <div>
      <OrderDetailsBreadcrumbs orderId={order.id} />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Deleted Order Banner */}
        {isDeleted && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700">
                Deleted Order
              </Badge>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This order has been deleted and is in read-only mode. You can view the details but cannot make changes.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Order Details</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              {isDeleted ? "View order information (Read-only)" : "View and manage order information"}
            </p>
          </div>
          {!isDeleted && (
          <div className="flex gap-2">
            <EditOrderDialog order={order} showText />
            <DeleteOrderDialog order={order} showText redirectAfterDelete disabled />
          </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardContent>
                <OrderItemsTable orderId={order.id} items={orderItems} isDeleted={isDeleted} />
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
                  <p className="text-sm font-mono mt-1 truncate" title={order.id}>{order.id}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">User</label>
                  {order.user_id ? (
                    <p className="text-sm mt-1 truncate" title={order.user_id}>User ID: {order.user_id}</p>
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
                  <p className="text-sm mt-1 truncate" title={order.phone || "—"}>{order.phone || "—"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <p className="text-sm mt-1 truncate" title={order.email || "—"}>{order.email || "—"}</p>
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
                  {address.address && (
                    <p className="text-sm truncate" title={address.address}>{address.address}</p>
                  )}
                  <p className="text-sm text-muted-foreground truncate" title={
                    [address.city, address.postal_code, address.country]
                      .filter(Boolean)
                      .join(", ")
                  }>
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
                {payment?.transaction_id && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Transaction ID</p>
                    <p className="text-sm font-mono truncate" title={payment.transaction_id}>{payment.transaction_id}</p>
                  </div>
                )}
                {payment?.payment_method && (
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Method</p>
                    <p className="text-sm capitalize truncate" title={payment.payment_method.replace('_', ' ')}>{payment.payment_method.replace('_', ' ')}</p>
                  </div>
                )}
                {payment?.gateway && (
                  <div>
                    <p className="text-xs text-muted-foreground">Gateway</p>
                    <p className="text-sm capitalize truncate" title={payment.gateway}>{payment.gateway}</p>
                  </div>
                )}
                {payment?.paid_at && (
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
                      <p className="text-sm font-medium truncate" title={shipment.carrier_name}>{shipment.carrier_name}</p>
                    </div>
                  )}
                  {shipment.tracking_number && (
                    <div>
                      <p className="text-xs text-muted-foreground">Tracking Number</p>
                      <p className="text-sm font-mono truncate" title={shipment.tracking_number}>{shipment.tracking_number}</p>
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
