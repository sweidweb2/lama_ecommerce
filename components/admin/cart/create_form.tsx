"use client";

import { useState, useEffect } from "react";
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
import { getUsersWithoutActiveCartsAction } from "@/actions/profile";
import { createCartAction } from "@/actions/cart";
import type { AdminProfileRow } from "@/repositories/profile.repository";

const NONE_VALUE = "__none__";

type CreateValues = {
  userId: string;
  sessionId: string;
};

const INITIAL: CreateValues = {
  userId: NONE_VALUE,
  sessionId: "",
};

export function CreateCartDialog() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminProfileRow[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUsersWithoutActiveCartsAction()
      .then((fetchedUsers) => {
        if (!cancelled) setUsers(fetchedUsers || []);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminFormDialog<CreateValues>
      mode="create"
      title="Create Cart"
      triggerLabel="Create Cart"
      initialValues={INITIAL}
      submitLabel="Create Cart"
      toastMessages={{
        success: "Cart created successfully",
        errorTitle: "Error",
      }}
      onSuccess={() => router.refresh()}
      onSubmit={async (values) => {
        if (values.userId === NONE_VALUE && !values.sessionId.trim()) {
          return {
            success: false,
            error: "Please provide either a user or a session ID",
          };
        }

        const result = await createCartAction({
          user_id: values.userId !== NONE_VALUE ? values.userId : null,
          session_id: values.sessionId.trim() || null,
        });

        if (!result.success) {
          return {
            success: false,
            error: result.error || "Failed to create cart",
          };
        }

        return { success: true };
      }}
    >
      {({ values, setValues }) => (
        <>
          <div className="space-y-2">
            <Label htmlFor="user-id">
              User{" "}
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </Label>
            <Select
              value={values.userId}
              onValueChange={(value) =>
                setValues((prev) => ({ ...prev, userId: value }))
              }
              disabled={isLoadingUsers}
            >
              <SelectTrigger id="user-id">
                <SelectValue
                  placeholder={
                    isLoadingUsers ? "Loading users..." : "Select a user"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {users.length === 0 && !isLoadingUsers ? (
                  <SelectItem value="__no_users__" disabled>
                    No users available (all users have active carts)
                  </SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.full_name || "Unknown"} ({user.email || "No email"})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!isLoadingUsers && users.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Showing {users.length} user
                {users.length !== 1 ? "s" : ""} without active carts
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-id">
              Session ID{" "}
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="session-id"
              value={values.sessionId}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  sessionId: e.target.value,
                }))
              }
              placeholder="Enter session ID"
            />
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <p>Note: At least one of User or Session ID must be provided.</p>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
