"use client";

import { useRouter } from "next/navigation";
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
import { updateProfileAction, resetUserPasswordAction } from "@/actions/profile";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

type EditValues = {
  name: string;
  role: string;
  status: "active" | "inactive";
  password: string;
  confirmPassword: string;
};

interface EditUserDialogProps {
  user: AdminUser;
}

export function EditUserDialog({ user }: EditUserDialogProps) {
  const router = useRouter();

  return (
    <AdminFormDialog<EditValues>
      mode="edit"
      title="Edit user"
      triggerLabel={`Edit ${user.name}`}
      initialValues={{
        name: user.name,
        role: user.role,
        status: user.status === "Active" ? "active" : "inactive",
        password: "",
        confirmPassword: "",
      }}
      submitLabel="Save changes"
      toastMessages={{
        errorTitle: "Update failed",
      }}
      onSuccess={() => router.refresh()}
      onSubmit={async (values) => {
        const wantsPasswordChange =
          values.password.length > 0 || values.confirmPassword.length > 0;

        if (wantsPasswordChange) {
          const pwResult = await resetUserPasswordAction(user.id, {
            password: values.password,
            confirmPassword: values.confirmPassword,
          });
          if (!pwResult?.success) {
            return {
              success: false,
              error: pwResult?.error ?? "Password update failed",
            };
          }
        }

        const result = await updateProfileAction(user.id, {
          full_name: values.name || undefined,
          role: values.role === "Admin" ? "admin" : "user",
          status: values.status,
        });

        if (!result?.success) {
          return {
            success: false,
            error: result?.error ?? "Update failed",
          };
        }

        return { success: true };
      }}
    >
      {({ values, setValues }) => (
        <>
          <div className="space-y-2">
            <Label htmlFor={`user-name-${user.id}`}>Name</Label>
            <Input
              id={`user-name-${user.id}`}
              value={values.name}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`user-email-${user.id}`}>Email</Label>
            <Input
              id={`user-email-${user.id}`}
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email is managed by auth and cannot be changed here.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`user-password-${user.id}`}>New password</Label>
            <Input
              id={`user-password-${user.id}`}
              type="password"
              value={values.password}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, password: e.target.value }))
              }
              autoComplete="new-password"
              placeholder="Leave blank to keep current"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`user-confirm-password-${user.id}`}>
              Confirm password
            </Label>
            <Input
              id={`user-confirm-password-${user.id}`}
              type="password"
              value={values.confirmPassword}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              autoComplete="new-password"
              placeholder="Leave blank to keep current"
            />
            <p className="text-xs text-muted-foreground">
              Optional. At least 8 characters when setting a new password.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`user-role-${user.id}`}>Role</Label>
            <Select
              value={values.role}
              onValueChange={(value) =>
                setValues((prev) => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger id={`user-role-${user.id}`} className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Customer">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`user-status-${user.id}`}>Status</Label>
            <Select
              value={values.status}
              onValueChange={(value) =>
                setValues((prev) => ({
                  ...prev,
                  status: value as "active" | "inactive",
                }))
              }
            >
              <SelectTrigger id={`user-status-${user.id}`} className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Inactive users cannot access their profile or account.
            </p>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
