"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";
import type { Category } from "@/types/product";

type CreateValues = {
  name: string;
  slug: string;
  parentId: string | "none";
  isActive: boolean;
};

interface CreateCategoryDialogProps {
  parentOptions: Category[];
  action: (formData: FormData) => void | Promise<void>;
}

const INITIAL: CreateValues = {
  name: "",
  slug: "",
  parentId: "none",
  isActive: true,
};

function validateCategoryFields(values: {
  name: string;
  slug: string;
}): string | null {
  const trimmedName = values.name.trim();
  const trimmedSlug = values.slug.trim();

  if (!trimmedName) return "Name is required.";
  if (trimmedName.length > 40) return "Name must be at most 40 characters.";

  if (!trimmedSlug) return "Slug is required.";
  if (trimmedSlug.length > 20) return "Slug must be at most 20 characters.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug)) {
    return "Slug can only contain lowercase letters, numbers, and hyphens.";
  }

  return null;
}

export function CreateCategoryDialog({
  parentOptions,
  action,
}: CreateCategoryDialogProps) {
  return (
    <AdminFormDialog<CreateValues>
      mode="create"
      title="Create Category"
      triggerLabel="Add Category"
      contentClassName="max-w-xl"
      initialValues={INITIAL}
      submitLabel="Create Category"
      toastMessages={{
        errorTitle: "Failed to create category",
      }}
      onSubmit={async (values) => {
        const validationError = validateCategoryFields(values);
        if (validationError) {
          return { success: false, error: validationError };
        }

        const formData = new FormData();
        formData.set("name", values.name.trim());
        formData.set("slug", values.slug.trim());
        formData.set(
          "parent_id",
          values.parentId === "none" ? "" : values.parentId,
        );
        formData.set("is_active", values.isActive ? "true" : "false");

        await action(formData);
        return { success: true };
      }}
    >
      {({ values, setValues }) => (
        <>
          <div className="space-y-2">
            <Label htmlFor="category-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="category-name"
              value={values.name}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, name: e.target.value }))
              }
              maxLength={40}
              placeholder="e.g., Electronics"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-slug">Slug</Label>
            <Input
              id="category-slug"
              value={values.slug}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                    .slice(0, 20),
                }))
              }
              maxLength={20}
              placeholder="e.g., electronics"
              required
            />
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier used in user pages category filters.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Parent Category</Label>
            <Select
              value={values.parentId}
              onValueChange={(value) =>
                setValues((prev) => ({
                  ...prev,
                  parentId: value as string | "none",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent (root)</SelectItem>
                {parentOptions.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.is_active ? cat.name : `${cat.name} (inactive)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Optional. Use this to build nested category trees.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="category-is-active"
                checked={values.isActive}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="category-is-active" className="cursor-pointer">
                Active
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Inactive categories will not be shown in the user pages.
            </p>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
