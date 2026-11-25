"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUserAction } from "@/actions/profile";
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";
import type { AdminUser } from "./edit_form";

type CreateValues = {
  name: string;
  email: string;
  password: string;
  role: AdminUser["role"];
  status: "Active" | "Inactive";
};

interface CreateUserDialogProps {
  onCreated?: (user: Partial<AdminUser>) => void;
}

const INITIAL: CreateValues = {
  name: "",
  email: "",
  password: "",
  role: "Customer",
  status: "Active",
};

export function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const router = useRouter();

  return (
    <AdminFormDialog<CreateValues>
      mode="create"
      title="Create new user"
      triggerLabel="Add user"
      initialValues={INITIAL}
      submitLabel="Create user"
      toastMessages={{
        errorTitle: "Failed to create user",
      }}
      onSuccess={() => router.refresh()}
      trigger={({ open }) => (
        <Button
          type="button"
          size="sm"
          className="gap-2"
          onClick={open}
        >
          <Plus className="h-4 w-4" />
          Add user
        </Button>
      )}
      onSubmit={async (values) => {
        const result = await createUserAction({
          full_name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          role: values.role === "Admin" ? "admin" : "user",
          status: values.status === "Active" ? "active" : "inactive",
        });

        if (result?.success && result.data) {
          onCreated?.({
            name: result.data.full_name ?? values.name,
            email: result.data.email ?? values.email,
            role: result.data.role === "admin" ? "Admin" : "Customer",
            status: result.data.is_active ? "Active" : "Inactive",
          });
          return { success: true };
        }

        return {
          success: false,
          error: result?.error ?? "Failed to create user",
        };
      }}
    >
      {({ values, setValues }) => (
        <>
          <div className="space-y-2">
            <Label htmlFor="create-user-name">Name</Label>
            <Input
              id="create-user-name"
              value={values.name}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-user-email">Email</Label>
            <Input
              id="create-user-email"
              type="email"
              value={values.email}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-user-password">Password</Label>
            <Input
              id="create-user-password"
              type="password"
              value={values.password}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, password: e.target.value }))
              }
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-user-role">Role</Label>
              <Select
                value={values.role}
                onValueChange={(value) =>
                  setValues((prev) => ({
                    ...prev,
                    role: value as AdminUser["role"],
                  }))
                }
              >
                <SelectTrigger id="create-user-role" className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-user-status">Status</Label>
              <Select
                value={values.status}
                onValueChange={(value) =>
                  setValues((prev) => ({
                    ...prev,
                    status: value as "Active" | "Inactive",
                  }))
                }
              >
                <SelectTrigger id="create-user-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
