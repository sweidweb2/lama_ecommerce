'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PaymentStatus, Payment } from '@/types/order'
import { formatDate } from '@/lib/utils'

const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded']

interface OrderPaymentFormProps {
  orderId: string
  initialPayment?: Payment | null
}

export function OrderPaymentForm({ orderId, initialPayment }: OrderPaymentFormProps) {
  const [status, setStatus] = useState<PaymentStatus>(initialPayment?.status || 'pending')
  const [transactionId, setTransactionId] = useState<string>(initialPayment?.transaction_id || '')
  const [amount, setAmount] = useState<string>(initialPayment?.amount?.toString() || '')
  const [currency, setCurrency] = useState<string>(initialPayment?.currency || 'USD')
  const [gateway, setGateway] = useState<string>(initialPayment?.gateway || '')
  const [paymentMethod, setPaymentMethod] = useState<string>(initialPayment?.payment_method || '')
  const [paymentUrl, setPaymentUrl] = useState<string>(initialPayment?.payment_url || '')
  const [paidAt, setPaidAt] = useState<string>(
    initialPayment?.paid_at ? new Date(initialPayment.paid_at).toISOString().slice(0, 16) : ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      const payload = {
        order_id: orderId,
        status,
        transaction_id: transactionId.trim() || null,
        paid_at: paidAt ? new Date(paidAt).toISOString() : null,
        amount: amount ? parseFloat(amount) : null,
        currency: currency.trim() || null,
        gateway: gateway.trim() || null,
        payment_method: paymentMethod.trim() || null,
        payment_url: paymentUrl.trim() || null,
      }

      // TODO: Wire this up to a real admin payment action / API
      console.log('Submitting payment:', payload)
    } catch (error) {
      console.error('Error submitting payment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Order ID</Label>
              <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md border">{orderId}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Payment Status <span className="text-destructive">*</span>
              </Label>
              <Select value={status} onValueChange={(value) => setStatus(value as PaymentStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="284.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gateway">Gateway</Label>
              <Input
                id="gateway"
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                placeholder="stripe, paypal, ..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Input
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="credit_card, bank_transfer, ..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-id">Transaction ID</Label>
            <Input
              id="transaction-id"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="TXN-123456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paid-at">Paid At</Label>
            <Input
              id="paid-at"
              type="datetime-local"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
            {initialPayment?.paid_at && (
              <p className="text-xs text-muted-foreground">
                Original paid at: {formatDate(initialPayment.paid_at)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-url">Payment URL</Label>
            <Input
              id="payment-url"
              value={paymentUrl}
              onChange={(e) => setPaymentUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Payment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}