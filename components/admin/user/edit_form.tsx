'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit } from "lucide-react"
import { updateProfileAction, resetUserPasswordAction } from "@/actions/profile"

export type AdminUser = {
  id: string
  name: string
  email: string
  role: string
  status: string
}

interface EditUserDialogProps {
  user: AdminUser
}

export function EditUserDialog({ user }: EditUserDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState(user.role)
  const [status, setStatus] = useState(user.status === "Active" ? "active" : "inactive")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetFields = () => {
    setName(user.name)
    setRole(user.role)
    setStatus(user.status === "Active" ? "active" : "inactive")
    setPassword("")
    setConfirmPassword("")
    setError(null)
  }

  useEffect(() => {
    if (open) {
      resetFields()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset from latest user when dialog opens
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const wantsPasswordChange = password.length > 0 || confirmPassword.length > 0
      if (wantsPasswordChange) {
        const pwResult = await resetUserPasswordAction(user.id, {
          password,
          confirmPassword,
        })
        if (!pwResult?.success) {
          setError(pwResult?.error ?? "Password update failed")
          return
        }
      }

      const result = await updateProfileAction(user.id, {
        full_name: name || undefined,
        role: role === "Admin" ? "admin" : "user",
        status: status as "active" | "inactive",
      })
      if (result?.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result?.error ?? "Update failed")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    resetFields()
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Edit ${user.name}`}
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) resetFields()
          setOpen(next)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor={`user-name-${user.id}`}>Name</Label>
              <Input
                id={`user-name-${user.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              <p className="text-xs text-muted-foreground">Email is managed by auth and cannot be changed here.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`user-password-${user.id}`}>New password</Label>
              <Input
                id={`user-password-${user.id}`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Leave blank to keep current"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`user-confirm-password-${user.id}`}>Confirm password</Label>
              <Input
                id={`user-confirm-password-${user.id}`}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                value={role}
                onValueChange={(value) => setRole(value)}
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
                value={status}
                onValueChange={(value) => setStatus(value as "active" | "inactive")}
              >
                <SelectTrigger id={`user-status-${user.id}`} className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Inactive users cannot access their profile or account.</p>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
