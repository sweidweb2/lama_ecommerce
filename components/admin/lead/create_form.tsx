"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";
import { createLeadAdminAction } from "@/actions/lead";

export type AdminLead = {
  id: string;
  email: string;
  user_id: string | null;
  status: string;
  source: string;
  unsubscribed_at: string | null;
  unsubscribe_token: string;
  created_at: string;
};

type CreateValues = {
  email: string;
};

interface CreateLeadDialogProps {
  onCreated?: () => void;
}

const INITIAL: CreateValues = {
  email: "",
};

export function CreateLeadDialog({ onCreated }: CreateLeadDialogProps) {
  return (
    <AdminFormDialog<CreateValues>
      mode="create"
      title="Add Lead"
      triggerLabel="Add Lead"
      initialValues={INITIAL}
      submitLabel="Add Lead"
      toastMessages={{
        success: "Lead created",
        errorTitle: "Failed to create lead",
      }}
      onSuccess={onCreated}
      onSubmit={async (values) => {
        const result = await createLeadAdminAction({
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
          <Label htmlFor="lead-email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lead-email"
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
