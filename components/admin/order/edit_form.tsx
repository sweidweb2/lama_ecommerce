'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit } from "lucide-react"
import type { OrderStatus, PaymentStatus, Order } from "@/types/order"

// Dummy users for selection
const DUMMY_USERS = [
  { id: "1", name: "John Doe", email: "john.doe@example.com" },
  { id: "2", name: "Jane Smith", email: "jane.smith@example.com" },
  { id: "3", name: "Bob Johnson", email: "bob.johnson@example.com" },
  { id: "4", name: "Alice Williams", email: "alice.williams@example.com" },
  { id: "5", name: "Charlie Brown", email: "charlie.brown@example.com" },
]

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'packed', 'shipped', 'delivered', 'returned', 'cancelled']
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded']

const NONE_VALUE = "__none__"

export type AdminOrder = Order & {
  userName?: string
}

interface EditOrderDialogProps {
  order: AdminOrder
  showText?: boolean
}

export function EditOrderDialog({ order, showText = false }: EditOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string>(order.user_id || NONE_VALUE)
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.payment_status)
  const [subtotal, setSubtotal] = useState<string>(order.subtotal?.toString() || "")
  const [shippingFee, setShippingFee] = useState<string>(order.shipping_fee?.toString() || "")
  const [discount, setDiscount] = useState<string>(order.discount?.toString() || "")
  const [phone, setPhone] = useState<string>(order.phone || "")
  const [email, setEmail] = useState<string>(order.email || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Calculate total
    const subtotalNum = parseFloat(subtotal) || 0
    const shippingFeeNum = parseFloat(shippingFee) || 0
    const discountNum = parseFloat(discount) || 0
    const total = subtotalNum + shippingFeeNum - discountNum

    // TODO: Wire this up to a real admin update action / API
    const updatedOrder = {
      id: order.id,
      user_id: userId !== NONE_VALUE ? userId : null,
      status,
      payment_status: paymentStatus,
      subtotal: subtotalNum || null,
      shipping_fee: shippingFeeNum || null,
      discount: discountNum || null,
      total: total || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
    }

    console.log("Updating order:", updatedOrder)

    setOpen(false)
  }

  const handleCancel = () => {
    // Reset to original values
    setUserId(order.user_id || NONE_VALUE)
    setStatus(order.status)
    setPaymentStatus(order.payment_status)
    setSubtotal(order.subtotal?.toString() || "")
    setShippingFee(order.shipping_fee?.toString() || "")
    setDiscount(order.discount?.toString() || "")
    setPhone(order.phone || "")
    setEmail(order.email || "")
    setOpen(false)
  }

  const subtotalNum = parseFloat(subtotal) || 0
  const shippingFeeNum = parseFloat(shippingFee) || 0
  const discountNum = parseFloat(discount) || 0
  const calculatedTotal = subtotalNum + shippingFeeNum - discountNum

  return (
    <>
      <Button
        variant={showText ? "outline" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Edit order ${order.id}`}
      >
        <Edit className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Edit"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor={`user-id-${order.id}`}>
                User <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger id={`user-id-${order.id}`}>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {DUMMY_USERS.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`status-${order.id}`}>
                  Order Status <span className="text-destructive">*</span>
                </Label>
                <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
                  <SelectTrigger id={`status-${order.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`payment-status-${order.id}`}>
                  Payment Status <span className="text-destructive">*</span>
                </Label>
                <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}>
                  <SelectTrigger id={`payment-status-${order.id}`}>
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`subtotal-${order.id}`}>Subtotal</Label>
                <Input
                  id={`subtotal-${order.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`shipping-fee-${order.id}`}>Shipping Fee</Label>
                <Input
                  id={`shipping-fee-${order.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`discount-${order.id}`}>Discount</Label>
                <Input
                  id={`discount-${order.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total:</span>
                <span className="text-lg font-bold">
                  ${calculatedTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`phone-${order.id}`}>Phone</Label>
                <Input
                  id={`phone-${order.id}`}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`email-${order.id}`}>Email</Label>
                <Input
                  id={`email-${order.id}`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
