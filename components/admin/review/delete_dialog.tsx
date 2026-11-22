'use client'

import { useRouter } from "next/navigation"
import {
  AdminDeleteDialog,
  toAdminActionResult,
} from "@/components/admin/shared/admin-delete-dialog"
import { deleteReviewAction } from "@/actions/review"
import type { AdminReview } from "./create_form"

interface DeleteReviewDialogProps {
  review: Pick<AdminReview, "id" | "product_name" | "user_name" | "rating">
  onDelete?: (reviewId: string) => void | Promise<void>
  showText?: boolean
}

export function DeleteReviewDialog({ review, onDelete, showText = false }: DeleteReviewDialogProps) {
  const router = useRouter()
  const reviewLabel = `${review.product_name} - ${review.user_name || "Guest"} (${review.rating}/5)`

  return (
    <AdminDeleteDialog
      title="Delete Review"
      entityLabel="review"
      ariaLabel={`Delete review ${review.id}`}
      confirmLabel="Delete Review"
      showText={showText}
      toastMessages={{
        success: onDelete ? undefined : "Review deleted",
        errorTitle: "Error",
      }}
      description={
        <>
          <p>
            Are you sure you want to delete the review{" "}
            <span className="font-semibold text-foreground">{reviewLabel}</span>?
          </p>
          <p>This action cannot be undone.</p>
        </>
      }
      onConfirm={async () => {
        try {
          if (onDelete) {
            await onDelete(review.id)
          } else {
            const result = toAdminActionResult(
              await deleteReviewAction(review.id),
              "Failed to delete review",
            )
            if (!result.success) return result
          }
        } catch (err) {
          return {
            success: false as const,
            error: err instanceof Error ? err.message : "Failed to delete review",
          }
        }
        router.refresh()
        return { success: true as const }
      }}
    />
  )
}
