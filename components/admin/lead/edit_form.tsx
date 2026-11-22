"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";
import { updateLeadAction } from "@/actions/lead";
import type { AdminLead } from "./create_form";

type EditValues = {
  email: string;
};

interface EditLeadDialogProps {
  lead: AdminLead;
  onUpdated?: () => void;
}

export function EditLeadDialog({ lead, onUpdated }: EditLeadDialogProps) {
  return (
    <AdminFormDialog<EditValues>
      mode="edit"
      title="Edit Lead"
      triggerLabel={`Edit lead ${lead.email}`}
      initialValues={{ email: lead.email }}
      submitLabel="Save Changes"
      toastMessages={{
        success: "Lead updated",
        errorTitle: "Failed to update lead",
      }}
      onSuccess={onUpdated}
      onSubmit={async (values) => {
        const result = await updateLeadAction({
          id: lead.id,
          email: values.email.trim(),
        });
        if (!result.success) {
          return { success: false, error: result.error };
        }
        return { success: true };
      }}
    >
      {({ values, setValues }) => (
        <div className="space-y-2">
          <Label htmlFor={`lead-email-${lead.id}`}>
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`lead-email-${lead.id}`}
            type="email"
            value={values.email}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="lead@example.com"
            required
          />
        </div>
      )}
    </AdminFormDialog>
  );
}
