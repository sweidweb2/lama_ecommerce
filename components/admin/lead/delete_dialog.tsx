"use client";

import { AdminDeleteDialog } from "@/components/admin/shared/admin-delete-dialog";
import type { AdminLead } from "./create_form";

interface DeleteLeadDialogProps {
  lead: Pick<AdminLead, "id" | "email">;
  onDelete?: (leadId: string) => void | Promise<void>;
  showText?: boolean;
}

export function DeleteLeadDialog({
  lead,
  onDelete,
  showText = false,
}: DeleteLeadDialogProps) {
  return (
    <AdminDeleteDialog
      title="Delete Lead"
      entityLabel="lead"
      ariaLabel={`Delete lead ${lead.email}`}
      confirmLabel="Delete Lead"
      showText={showText}
      suppressErrorToast
      description={
        <>
          <p>
            Are you sure you want to delete the lead{" "}
            <span className="font-semibold text-foreground">{lead.email}</span>
            ?
          </p>
          <p>This action cannot be undone.</p>
        </>
      }
      onConfirm={async () => {
        await onDelete?.(lead.id);
      }}
    />
  );
}
