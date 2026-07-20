'use client'

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
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
import { Edit, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateOrderAction } from "@/actions/order"
import { getAllowedOrderStatuses } from "@/lib/admin/order-status-transitions"
import type { OrderStatus, PaymentStatus, Order } from "@/types/order"

const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded']

export type AdminOrder = Order & {
  userName?: string
}

interface EditOrderDialogProps {
  order: AdminOrder
  showText?: boolean
  hasShipment?: boolean
  onUpdated?: () => void | Promise<void>
}

export function EditOrderDialog({
  order,
  showText = false,
  hasShipment = false,
  onUpdated,
}: EditOrderDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.payment_status)
  const [shippingFee, setShippingFee] = useState<string>(order.shipping_fee?.toString() || "")
  const [discount, setDiscount] = useState<string>(order.discount?.toString() || "")
  const [phone, setPhone] = useState<string>(order.phone || "")
  const [email, setEmail] = useState<string>(order.email || "")

  // Create a stable dependency key from order data to avoid array size changes
  const orderKey = useMemo(() => {
    return JSON.stringify({
      id: order.id,
      status: order.status,
      payment_status: order.payment_status,
      shipping_fee: order.shipping_fee ?? null,
      discount: order.discount ?? null,
      phone: order.phone ?? null,
      email: order.email ?? null,
      updated_at: order.updated_at,
    })
  }, [
    order.id,
    order.status,
    order.payment_status,
    order.shipping_fee,
    order.discount,
    order.phone,
    order.email,
    order.updated_at,
  ])

  // Sync form state with order prop when it changes
  // Use orderKey as a stable dependency to avoid array size issues
  useEffect(() => {
    setStatus(order.status)
    setPaymentStatus(order.payment_status)
    setShippingFee(order.shipping_fee?.toString() || "")
    setDiscount(order.discount?.toString() || "")
    setPhone(order.phone || "")
    setEmail(order.email || "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKey])

  // Reset form state when dialog opens to ensure fresh data
  const handleOpenChange = (isOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(isOpen)
      if (isOpen) {
        // Reset form to current order values when opening
        setStatus(order.status)
        setPaymentStatus(order.payment_status)
        setShippingFee(order.shipping_fee?.toString() || "")
        setDiscount(order.discount?.toString() || "")
        setPhone(order.phone || "")
        setEmail(order.email || "")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    const canSetShipped = order.status === "shipped" || hasShipment
    if (status === "shipped" && !canSetShipped) {
      toast.error("Cannot mark as shipped here", {
        description:
          "Use Order Status on the order detail page to mark shipped (carrier + tracking).",
      })
      return
    }

    // Calculate total using original subtotal + edited shipping fee - discount
    const subtotalNum = order.subtotal || 0
    const shippingFeeNum = parseFloat(shippingFee) || 0
    const discountNum = parseFloat(discount) || 0
    const total = subtotalNum + shippingFeeNum - discountNum

    setIsSubmitting(true)

    try {
      const result = await updateOrderAction(order.id, {
        status,
        payment_status: paymentStatus,
        // shipping_fee and discount are not editable - use original values
        shipping_fee: order.shipping_fee ?? null,
        discount: order.discount ?? null,
        total: order.total ?? null,
        phone: phone.trim() || null,
        email: email.trim() || null,
      })

      if (!result.success) {
        toast.error("Failed to update order", {
          description: result.error || "An error occurred while updating the order.",
        })
        return
      }

      toast.success("Order updated", {
        description: "The order has been successfully updated.",
      })

      setOpen(false)
      
      // Call onUpdated callback if provided
      if (onUpdated) {
        await onUpdated()
      }
      
      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error("Error updating order:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to update order. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset to original values
    setStatus(order.status)
    setPaymentStatus(order.payment_status)
    setShippingFee(order.shipping_fee?.toString() || "")
    setDiscount(order.discount?.toString() || "")
    setPhone(order.phone || "")
    setEmail(order.email || "")
    setOpen(false)
  }

  // Calculate total using original subtotal + edited shipping fee - discount
  const subtotalNum = order.subtotal || 0
  const shippingFeeNum = parseFloat(shippingFee) || 0
  const discountNum = parseFloat(discount) || 0
  const calculatedTotal = subtotalNum + shippingFeeNum - discountNum
  const canSetShipped = order.status === "shipped" || hasShipment
  const allowedStatuses = getAllowedOrderStatuses(order.status)

  return (
    <>
      <Button
        variant={showText ? "outline" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => handleOpenChange(true)}
        aria-label={`Edit order ${order.id}`}
      >
        <Edit className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Edit"}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`status-${order.id}`}>
                  Order Status <span className="text-destructive">*</span>
                </Label>
                <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)} disabled={isSubmitting}>
                  <SelectTrigger id={`status-${order.id}`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedStatuses.map((s) => (
                      <SelectItem
                        key={s}
                        value={s}
                        disabled={s === "shipped" && !canSetShipped}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!canSetShipped && (
                  <p className="text-xs text-muted-foreground">
                    Use Order Status on the order detail page to mark shipped
                    (carrier + tracking).
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`payment-status-${order.id}`}>
                  Payment Status <span className="text-destructive">*</span>
                </Label>
                <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatus)} disabled={isSubmitting}>
                  <SelectTrigger id={`payment-status-${order.id}`} className="w-full">
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
                <p className="text-xs text-muted-foreground">
                  Failed or refunded does not restore stock. Set status to
                  cancelled to restock.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  disabled={true}
                  className="bg-muted cursor-not-allowed"
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
                  disabled={true}
                  className="bg-muted cursor-not-allowed"
                />
              </div>
            </div>

            <div className="bg-muted p-3 rounded-md space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${subtotalNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Shipping Fee:</span>
                <span className="font-medium">${shippingFeeNum.toFixed(2)}</span>
              </div>
              {discountNum > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium text-green-600">-${discountNum.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between items-center">
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
