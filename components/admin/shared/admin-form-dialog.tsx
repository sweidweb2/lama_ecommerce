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
import { Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import type { AdminActionResult } from "./admin-action-result";

type AdminFormDialogProps<TValues> = {
  mode: "create" | "edit";
  title: string;
  /** Built-in Plus/Edit trigger; ignored when `trigger` is provided. */
  triggerLabel?: string;
  /**
   * Custom trigger. Pass a render function to receive `open()` so the custom
   * element can open the dialog (a plain ReactNode cannot).
   */
  trigger?: ReactNode | ((ctx: { open: () => void }) => ReactNode);
  contentClassName?: string;
  initialValues: TValues;
  submitLabel?: string;
  toastMessages?: { success?: string; errorTitle?: string };
  children: (ctx: {
    values: TValues;
    setValues: React.Dispatch<React.SetStateAction<TValues>>;
    isSubmitting: boolean;
  }) => ReactNode;
  onSubmit: (values: TValues) => Promise<AdminActionResult>;
  onSuccess?: () => void;
};

/**
 * Shared admin create/edit dialog shell.
 * Entity dialogs supply field UI via children and a single onSubmit callback.
 */
export function AdminFormDialog<TValues>({
  mode,
  title,
  triggerLabel,
  trigger,
  contentClassName,
  initialValues,
  submitLabel,
  toastMessages,
  children,
  onSubmit,
  onSuccess,
}: AdminFormDialogProps<TValues>) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<TValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => setValues(initialValues);

  const openDialog = () => {
    setValues(initialValues);
    setOpen(true);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
    else setValues(initialValues);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await onSubmit(values);
      if (!result.success) {
        toast.error(toastMessages?.errorTitle ?? "Request failed", {
          description: result.error,
        });
        return;
      }
      if (toastMessages?.success) {
        toast.success(toastMessages.success);
      }
      onSuccess?.();
      setOpen(false);
      reset();
    } catch (error) {
      console.error(`Error in ${mode} form:`, error);
      toast.error(toastMessages?.errorTitle ?? "Request failed", {
        description:
          error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger =
    mode === "create" ? (
      <Button onClick={openDialog}>
        <Plus className="mr-2 h-4 w-4" />
        {triggerLabel ?? "Create"}
      </Button>
    ) : (
      <Button
        variant="ghost"
        size="icon"
        onClick={openDialog}
        aria-label={triggerLabel ?? "Edit"}
      >
        <Edit className="h-4 w-4" />
      </Button>
    );

  return (
    <>
      {typeof trigger === "function"
        ? trigger({ open: openDialog })
        : (trigger ?? defaultTrigger)}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className={contentClassName}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {children({ values, setValues, isSubmitting })}
            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {submitLabel ?? (mode === "create" ? "Create" : "Save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
