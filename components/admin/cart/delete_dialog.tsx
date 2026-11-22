'use client'

import { useRouter, usePathname } from "next/navigation"
import {
  AdminDeleteDialog,
  toAdminActionResult,
} from "@/components/admin/shared/admin-delete-dialog"
import { hardDeleteCartAction } from "@/actions/cart"

interface DeleteCartDialogProps {
  cart: {
    id: string
    user_id?: string | null
    session_id?: string | null
  }
  onDelete?: (cartId: string) => void | Promise<void>
  showText?: boolean
}

export function DeleteCartDialog({ cart, onDelete, showText = false }: DeleteCartDialogProps) {
  const router = useRouter()
  const pathname = usePathname()

  const cartIdentifier = cart.user_id
    ? `User ID: ${cart.user_id}`
    : cart.session_id
    ? `Session ID: ${cart.session_id}`
    : cart.id

  return (
    <AdminDeleteDialog
      title="Delete Cart"
      entityLabel="cart"
      ariaLabel={`Delete cart ${cart.id}`}
      confirmLabel="Delete Cart"
      showText={showText}
      toastMessages={{
        success: onDelete ? undefined : "Cart deleted",
        errorTitle: "Failed to delete cart",
      }}
      description={
        <>
          <p>
            Are you sure you want to delete the cart{" "}
            <span className="font-semibold text-foreground">{cartIdentifier}</span>?
          </p>
          <p>This action cannot be undone. All associated cart items will be permanently removed.</p>
        </>
      }
      onConfirm={async () => {
        if (onDelete) {
          await onDelete(cart.id)
        } else {
          // Hard delete deletes items first, then the cart
          const result = toAdminActionResult(
            await hardDeleteCartAction(cart.id),
            "Failed to delete cart. Please try again.",
          )
          if (result && !result.success) return result
        }

        // If we're on the cart details page, redirect to carts list
        if (pathname?.includes(`/admin/carts/${cart.id}`)) {
          router.push("/admin/carts")
        } else {
          router.refresh()
        }
      }}
    />
  )
}
