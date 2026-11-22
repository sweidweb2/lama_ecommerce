"use client";

import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminActionResult } from "./admin-action-result";

export { toAdminActionResult, type AdminActionResult } from "./admin-action-result";

type AdminDeleteDialogProps = {
  title: string;
  description: ReactNode;
  entityLabel: string;
  confirmLabel?: string;
  showText?: boolean;
  toastMessages?: {
    success?: string;
    errorTitle?: string;
  };
  /** Overrides the trigger button aria-label (default: `Delete ${entityLabel}`). */
  ariaLabel?: string;
  /** Disables the trigger button. */
  disabled?: boolean;
  triggerTitle?: string;
  triggerClassName?: string;
  confirmClassName?: string;
  onConfirm: () => Promise<AdminActionResult>;
};

/**
 * Shared admin delete confirmation dialog.
 * Owns open/loading state; entity files only supply copy + onConfirm.
 */
export function AdminDeleteDialog({
  title,
  description,
  entityLabel,
  confirmLabel = "Delete",
  showText = false,
  toastMessages,
  ariaLabel,
  disabled = false,
  triggerTitle,
  triggerClassName,
  confirmClassName,
  onConfirm,
}: AdminDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await onConfirm();
      if (!result.success) {
        toast.error(toastMessages?.errorTitle ?? "Cannot delete", {
          description: result.error,
        });
        return;
      }
      if (toastMessages?.success) {
        toast.success(toastMessages.success);
      }
      setOpen(false);
    } catch (error) {
      console.error(`Error deleting ${entityLabel}:`, error);
      toast.error(
        toastMessages?.errorTitle ?? `Failed to delete ${entityLabel}`,
        {
          description:
            error instanceof Error ? error.message : "Unexpected error",
        },
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant={showText ? "destructive" : "ghost"}
        size={showText ? "default" : "icon"}
        className={triggerClassName}
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={triggerTitle}
        aria-label={ariaLabel ?? `Delete ${entityLabel}`}
      >
        <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-2 text-sm text-muted-foreground">
            {description}
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className={confirmClassName}
              onClick={handleDelete}
              loading={isDeleting}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
