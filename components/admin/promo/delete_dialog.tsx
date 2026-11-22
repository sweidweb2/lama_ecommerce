'use client'

import { AdminDeleteDialog } from "@/components/admin/shared/admin-delete-dialog"
import type { AdminPromoCode } from "./create_form"

interface DeletePromoCodeDialogProps {
  promoCode: Pick<AdminPromoCode, "id" | "code">
  onDelete?: (promoCodeId: string) => void | Promise<void>
  showText?: boolean
}

export function DeletePromoCodeDialog({ promoCode, onDelete, showText = false }: DeletePromoCodeDialogProps) {
  return (
    <AdminDeleteDialog
      title="Delete Promo Code"
      entityLabel="promo code"
      ariaLabel={`Delete promo code ${promoCode.code}`}
      confirmLabel="Delete Promo Code"
      showText={showText}
      description={
        <>
          <p>
            Are you sure you want to delete the promo code{" "}
            <span className="font-semibold text-foreground">{promoCode.code}</span>?
          </p>
          <p>This action cannot be undone.</p>
        </>
      }
      onConfirm={async () => {
        try {
          await onDelete?.(promoCode.id)
          return { success: true as const }
        } catch (e) {
          return {
            success: false as const,
            error: e instanceof Error ? e.message : "Delete failed",
          }
        }
      }}
    />
  )
}
