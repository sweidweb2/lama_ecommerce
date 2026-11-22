'use client'

import { useRouter } from "next/navigation"
import {
  AdminDeleteDialog,
  toAdminActionResult,
} from "@/components/admin/shared/admin-delete-dialog"
import { deleteOrderAction } from "@/actions/order"

interface DeleteOrderDialogProps {
  order: {
    id: string
    status?: string
    total?: number | null
  }
  onDelete?: (orderId: string) => void | Promise<void>
  showText?: boolean
  redirectAfterDelete?: boolean
  disabled?: boolean
}

export function DeleteOrderDialog({ order, onDelete, showText = false, redirectAfterDelete = false, disabled = false }: DeleteOrderDialogProps) {
  const router = useRouter()

  return (
    <AdminDeleteDialog
      title="Delete Order"
      entityLabel="order"
      ariaLabel={`Delete order ${order.id}`}
      triggerTitle={disabled ? "Delete order is disabled" : "Delete order"}
      confirmLabel="Delete Order"
      showText={showText}
      disabled={disabled}
      toastMessages={{
        success: onDelete ? undefined : "Order deleted successfully",
        errorTitle: "Failed to delete order",
      }}
      description={
        <>
          <p>
            Are you sure you want to delete order{" "}
            <span className="font-semibold text-foreground">{order.id.slice(0, 8)}...</span>?
          </p>
          <p>
            This permanently deletes the order, its line items, payments, and
            shipments. If stock was never restored, inventory is returned
            before delete.
          </p>
        </>
      }
      onConfirm={async () => {
        try {
          if (onDelete) {
            await onDelete(order.id)
            return { success: true as const }
          }

          const result = toAdminActionResult(
            await deleteOrderAction(order.id),
            "Failed to delete order",
          )
          if (!result.success) return result
        } catch (e) {
          return {
            success: false as const,
            error: e instanceof Error ? e.message : "Failed to delete order",
          }
        }

        if (redirectAfterDelete) {
          router.push("/admin/orders")
        } else {
          router.refresh()
        }
        return { success: true as const }
      }}
    />
  )
}
