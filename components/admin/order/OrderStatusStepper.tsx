'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateOrderStatusAction } from '@/actions/order'
import {
  canTransitionOrderStatus,
} from '@/lib/admin/order-status-transitions'
import {
  Clock,
  Settings,
  PackageCheck,
  Truck,
  CircleCheckBig,
  Check,
} from 'lucide-react'
import type { OrderStatus } from '@/types/order'

/** The 5 trackable order phases (excludes returned & cancelled). */
const ORDER_STEPS: {
  status: OrderStatus
  label: string
  icon: typeof Clock
}[] = [
  { status: 'pending',    label: 'Pending',    icon: Clock },
  { status: 'processing', label: 'Processing', icon: Settings },
  { status: 'packed',     label: 'Packed',     icon: PackageCheck },
  { status: 'shipped',    label: 'Shipped',    icon: Truck },
  { status: 'delivered',  label: 'Delivered',  icon: CircleCheckBig },
]

interface OrderStatusStepperProps {
  orderId: string
  currentStatus: OrderStatus
  isDeleted?: boolean
  /** When true, order already has a shipments row (carrier/tracking not required again). */
  hasShipment?: boolean
}

export function OrderStatusStepper({
  orderId,
  currentStatus,
  isDeleted = false,
  hasShipment = false,
}: OrderStatusStepperProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [carrierName, setCarrierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const isProcessingRef = useRef(false)

  // Current step index (-1 if status is not in the trackable steps, e.g. cancelled/returned)
  const currentStepIndex = ORDER_STEPS.findIndex(
    (s) => s.status === currentStatus
  )

  const isNonTrackable =
    currentStatus === 'cancelled' || currentStatus === 'returned'

  const needsShipmentFields =
    pendingStatus === 'shipped' && !hasShipment

  const canConfirmShipment =
    !needsShipmentFields ||
    (carrierName.trim().length > 0 && trackingNumber.trim().length > 0)

  const handleStepClick = (status: OrderStatus) => {
    if (isDeleted) return
    if (isProcessingRef.current) return
    if (status === currentStatus) return
    if (isNonTrackable) return
    if (!canTransitionOrderStatus(currentStatus, status)) return

    setPendingStatus(status)
    setCarrierName('')
    setTrackingNumber('')
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!pendingStatus || isProcessingRef.current) return
    if (needsShipmentFields && !canConfirmShipment) return

    isProcessingRef.current = true
    setIsUpdating(true)

    try {
      const result = await updateOrderStatusAction(
        orderId,
        pendingStatus,
        needsShipmentFields
          ? {
              carrier_name: carrierName.trim(),
              tracking_number: trackingNumber.trim(),
            }
          : undefined,
      )

      if (result.success) {
        toast.success('Status updated', {
          description: `Order status changed to "${pendingStatus}".`,
        })
        setConfirmOpen(false)
        setPendingStatus(null)
        router.refresh()
      } else {
        toast.error('Failed to update status', {
          description: result.error || 'An error occurred.',
        })
      }
    } catch {
      toast.error('Error', {
        description: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      isProcessingRef.current = false
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    if (isUpdating) return
    setConfirmOpen(false)
    setPendingStatus(null)
    setCarrierName('')
    setTrackingNumber('')
  }

  const pendingStepConfig = pendingStatus
    ? ORDER_STEPS.find((s) => s.status === pendingStatus)
    : null

  return (
    <>
      <div className="w-full">
        <div className="flex items-stretch gap-2 sm:gap-3">
          {ORDER_STEPS.map((step, index) => {
            const Icon = step.icon
            const isCurrent = index === currentStepIndex
            const isCompleted = currentStepIndex >= 0 && index < currentStepIndex
            const isAllowedNext =
              !isNonTrackable && canTransitionOrderStatus(currentStatus, step.status)
            const isClickable =
              !isDeleted &&
              !isNonTrackable &&
              !isCurrent &&
              !isUpdating &&
              isAllowedNext

            let cardClasses: string
            let iconClasses: string
            let labelClasses: string

            if (isCurrent) {
              cardClasses = 'bg-primary text-primary-foreground border-2 border-primary shadow-sm'
              iconClasses = 'text-primary-foreground'
              labelClasses = 'text-primary-foreground font-semibold'
            } else if (isCompleted) {
              cardClasses = 'bg-primary/8 border border-dashed border-primary/25'
              iconClasses = 'text-primary/40'
              labelClasses = 'text-primary/40 font-medium'
            } else if (isNonTrackable || !isAllowedNext) {
              cardClasses = 'bg-muted/20 border border-muted-foreground/8'
              iconClasses = 'text-muted-foreground/25'
              labelClasses = 'text-muted-foreground/25'
            } else {
              cardClasses = 'bg-secondary/40 border border-border/50'
              iconClasses = 'text-muted-foreground/35'
              labelClasses = 'text-muted-foreground/35'
            }

            return (
              <button
                key={step.status}
                type="button"
                disabled={!isClickable}
                onClick={() => handleStepClick(step.status)}
                className={`
                  relative flex-1 flex flex-col items-center justify-center gap-1.5 sm:gap-2
                  rounded-xl p-3 sm:p-4 transition-all duration-200
                  ${cardClasses}
                  ${isClickable ? 'cursor-pointer hover:bg-primary/15 hover:border-primary/40 hover:shadow-md' : 'cursor-default'}
                  ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
                `}
                aria-label={`Set order status to ${step.label}`}
                title={
                  isDeleted
                    ? 'Order is deleted'
                    : isNonTrackable
                    ? `Order is ${currentStatus}`
                    : isCurrent
                    ? 'Current status'
                    : !isAllowedNext
                    ? `Cannot change from ${currentStatus} to ${step.label}`
                    : `Change status to ${step.label}`
                }
              >
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 rounded-full bg-background shadow-sm border border-border p-[3px]">
                    <Check className="h-2.5 w-2.5 text-primary/50" />
                  </div>
                )}

                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconClasses} transition-colors`} />
                <span className={`text-[10px] sm:text-xs leading-tight text-center ${labelClasses} transition-colors`}>
                  {step.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center mt-2.5 px-6 sm:px-8">
          {ORDER_STEPS.map((step, index) => {
            if (index === ORDER_STEPS.length - 1) return null
            const isDone = currentStepIndex >= 0 && index < currentStepIndex

            return (
              <div key={`line-${step.status}`} className="flex-1 h-[3px] mx-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDone ? 'bg-primary/30' : 'bg-border/40'
                  }`}
                />
              </div>
            )
          })}
        </div>

        {isNonTrackable && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-medium">
              Order is {currentStatus} — status changes are disabled
            </span>
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open) => { if (!open) handleCancel() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the order status?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            <div className="flex items-center justify-center gap-5">
              <div className="flex flex-col items-center gap-2">
                {(() => {
                  const fromStep = ORDER_STEPS.find(
                    (s) => s.status === currentStatus
                  )
                  const FromIcon = fromStep?.icon ?? Clock
                  return (
                    <>
                      <div className="rounded-xl border border-border bg-secondary/50 p-3.5">
                        <FromIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <span className="text-xs text-muted-foreground capitalize font-medium">
                        {currentStatus}
                      </span>
                    </>
                  )
                })()}
              </div>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-muted-foreground/40 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>

              <div className="flex flex-col items-center gap-2">
                {pendingStepConfig && (
                  <>
                    <div className="rounded-xl border-2 border-primary bg-primary p-3.5">
                      <pendingStepConfig.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-semibold capitalize text-primary">
                      {pendingStepConfig.label}
                    </span>
                  </>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              This will update the order status from{' '}
              <strong className="text-foreground capitalize">
                {currentStatus}
              </strong>{' '}
              to{' '}
              <strong className="text-foreground capitalize">
                {pendingStatus}
              </strong>
              .
            </p>

            {needsShipmentFields && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Enter carrier and tracking to create the shipment record.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="shipment-carrier" className="text-xs">
                    Carrier <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="shipment-carrier"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="e.g. DHL"
                    disabled={isUpdating}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shipment-tracking" className="text-xs">
                    Tracking number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="shipment-tracking"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Tracking number"
                    disabled={isUpdating}
                    className="h-9"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              loading={isUpdating}
              disabled={!canConfirmShipment}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
