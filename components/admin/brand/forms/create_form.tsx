"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";
import { createBrandSchema } from "@/lib/validators/brand";
import {
  MAX_SERVER_ACTION_UPLOAD_BYTES,
  MAX_SERVER_ACTION_UPLOAD_LABEL,
} from "@/lib/constants/uploads";

type CreateValues = {
  name: string;
  slug: string;
  logoFile: File | null;
};

interface CreateBrandDialogProps {
  action: (formData: FormData) => void | Promise<void>;
}

const INITIAL: CreateValues = {
  name: "",
  slug: "",
  logoFile: null,
};

export function CreateBrandDialog({ action }: CreateBrandDialogProps) {
  return (
    <AdminFormDialog<CreateValues>
      mode="create"
      title="Create Brand"
      triggerLabel="Add Brand"
      contentClassName="max-w-xl"
      initialValues={INITIAL}
      submitLabel="Create Brand"
      toastMessages={{
        errorTitle: "Failed to create brand",
      }}
      onSubmit={async (values) => {
        const parsed = createBrandSchema.safeParse({
          name: values.name.trim(),
          slug: values.slug.trim() || null,
        });

        if (!parsed.success) {
          return {
            success: false,
            error:
              parsed.error.issues[0]?.message ?? "Please fix the form errors",
          };
        }

        if (
          values.logoFile &&
          values.logoFile.size > MAX_SERVER_ACTION_UPLOAD_BYTES
        ) {
          return {
            success: false,
            error: `Logo must be ${MAX_SERVER_ACTION_UPLOAD_LABEL} or smaller`,
          };
        }

        const formData = new FormData();
        formData.set("name", parsed.data.name);
        formData.set("slug", parsed.data.slug ?? "");
        if (values.logoFile) {
          formData.set("logo_file", values.logoFile);
        }

        await action(formData);
        return { success: true };
      }}
    >
      {({ values, setValues }) => (
        <>
          <div className="space-y-2">
            <Label htmlFor="brand-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="brand-name"
              value={values.name}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, name: e.target.value }))
              }
              maxLength={100}
              placeholder="e.g., Northline"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-slug">Slug</Label>
            <Input
              id="brand-slug"
              value={values.slug}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                    .slice(0, 50),
                }))
              }
              maxLength={50}
              placeholder="e.g., northline"
            />
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier. Leave empty to generate later.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-logo-file">Logo Image</Label>
            <Input
              id="brand-logo-file"
              key={values.logoFile?.name ?? "no-logo"}
              type="file"
              accept="image/*"
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  logoFile: e.target.files?.[0] ?? null,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Upload a logo image for this brand. Max{" "}
              {MAX_SERVER_ACTION_UPLOAD_LABEL}.
            </p>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
