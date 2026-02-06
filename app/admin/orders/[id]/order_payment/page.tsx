import { OrderPaymentBreadcrumbs } from '@/components/admin/order/OrderPaymentBreadcrumbs'
import { OrderPaymentForm } from '@/components/admin/order/OrderPaymentForm'
import type { Payment } from '@/types/order'

interface OrderPaymentPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OrderPaymentPage({ params }: OrderPaymentPageProps) {
  const { id } = await params

  // Dummy existing payment data - in a real app, fetch from database
  const initialPayment: Payment = {
    id: 'payment-1',
    order_id: id,
    status: 'paid',
    transaction_id: 'TXN-123456789',
    paid_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 284.99,
    currency: 'USD',
    gateway: 'stripe',
    payment_method: 'credit_card',
    payment_url: null,
    callback_payload: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    deleted_at: null,
  }

  return (
    <div>
      <OrderPaymentBreadcrumbs orderId={id} />

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Order Payment</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage payment details for this order
          </p>
        </div>

        <OrderPaymentForm orderId={id} initialPayment={initialPayment} />
      </div>
    </div>
  )
}