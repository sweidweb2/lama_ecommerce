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
import { updateOrderStatusAction } from '@/actions/order'
import {
  Clock,
  Settings,
  PackageCheck,
  Truck,
  CircleCheckBig,
  Check,
  Loader2,
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
}

export function OrderStatusStepper({
  orderId,
  currentStatus,
  isDeleted = false,
}: OrderStatusStepperProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const isProcessingRef = useRef(false)

  // Current step index (-1 if status is not in the trackable steps, e.g. cancelled/returned)
  const currentStepIndex = ORDER_STEPS.findIndex(
    (s) => s.status === currentStatus
  )

  const isNonTrackable =
    currentStatus === 'cancelled' || currentStatus === 'returned'

  const handleStepClick = (status: OrderStatus, stepIndex: number) => {
    // Don't allow changes on deleted orders
    if (isDeleted) return
    // Don't allow changes if already updating
    if (isProcessingRef.current) return
    // Don't allow clicking the current step
    if (status === currentStatus) return
    // Don't allow changes on cancelled/returned orders
    if (isNonTrackable) return

    setPendingStatus(status)
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!pendingStatus || isProcessingRef.current) return
    isProcessingRef.current = true
    setIsUpdating(true)

    try {
      const result = await updateOrderStatusAction(orderId, pendingStatus)

      if (result.success) {
        toast.success('Status updated', {
          description: `Order status changed to "${pendingStatus}".`,
        })
        setConfirmOpen(false)
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
  }

  // Find the pending step config for the confirmation dialog
  const pendingStepConfig = pendingStatus
    ? ORDER_STEPS.find((s) => s.status === pendingStatus)
    : null

  return (
    <>
      <div className="w-full">
        {/* Step cards row */}
        <div className="flex items-stretch gap-2 sm:gap-3">
          {ORDER_STEPS.map((step, index) => {
            const Icon = step.icon
            const isCurrent = index === currentStepIndex
            const isCompleted = currentStepIndex >= 0 && index < currentStepIndex
            const isClickable =
              !isDeleted && !isNonTrackable && !isCurrent && !isUpdating

            // ── Card style logic using design-system tokens ──
            let cardClasses: string
            let iconClasses: string
            let labelClasses: string

            if (isCurrent) {
              // ★ Active step — primary colour fill
              cardClasses = 'bg-primary text-primary-foreground border-2 border-primary shadow-sm'
              iconClasses = 'text-primary-foreground'
              labelClasses = 'text-primary-foreground font-semibold'
            } else if (isCompleted) {
              // ✓ Completed step — ghost / faded primary
              cardClasses = 'bg-primary/8 border border-dashed border-primary/25'
              iconClasses = 'text-primary/40'
              labelClasses = 'text-primary/40 font-medium'
            } else if (isNonTrackable) {
              // All steps dim for cancelled / returned
              cardClasses = 'bg-muted/20 border border-muted-foreground/8'
              iconClasses = 'text-muted-foreground/25'
              labelClasses = 'text-muted-foreground/25'
            } else {
              // Future step — neutral muted
              cardClasses = 'bg-secondary/40 border border-border/50'
              iconClasses = 'text-muted-foreground/35'
              labelClasses = 'text-muted-foreground/35'
            }

            return (
              <button
                key={step.status}
                type="button"
                disabled={!isClickable}
                onClick={() => handleStepClick(step.status, index)}
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
                    : `Change status to ${step.label}`
                }
              >
                {/* Completed checkmark */}
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

        {/* Connector line */}
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

        {/* Non-trackable banner */}
        {isNonTrackable && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-medium">
              Order is {currentStatus} — status changes are disabled
            </span>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the order status?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            {/* From → To */}
            <div className="flex items-center justify-center gap-5">
              {/* From */}
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

              {/* Arrow */}
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

              {/* To */}
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
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
