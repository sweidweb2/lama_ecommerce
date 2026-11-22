'use client'

import { AdminDeleteDialog } from "@/components/admin/shared/admin-delete-dialog"
import type { AdminShippingZone } from "./create_form"

interface DeleteShippingZoneDialogProps {
  zone: Pick<AdminShippingZone, "id" | "name">
  onDelete?: (zoneId: string) => void | Promise<void>
  showText?: boolean
}

export function DeleteShippingZoneDialog({ zone, onDelete, showText = false }: DeleteShippingZoneDialogProps) {
  return (
    <AdminDeleteDialog
      title="Delete Shipping Zone"
      entityLabel="shipping zone"
      ariaLabel={`Delete shipping zone ${zone.name}`}
      confirmLabel="Delete Zone"
      showText={showText}
      description={
        <>
          <p>
            Are you sure you want to delete the shipping zone{" "}
            <span className="font-semibold text-foreground">{zone.name}</span>?
          </p>
          <p>This will also delete the associated shipping fee. This action cannot be undone.</p>
        </>
      }
      onConfirm={async () => {
        try {
          await onDelete?.(zone.id)
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
