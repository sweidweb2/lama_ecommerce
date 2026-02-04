'use client'

import { useState } from "react"
import { Plus } from "lucide-react"
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
import type { AdminUser } from "./edit_form"

interface CreateUserDialogProps {
  // Optional callback for when a user is created later
  onCreated?: (user: Partial<AdminUser>) => void
}

export function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<AdminUser["role"]>("Customer")
  const [status, setStatus] = useState<AdminUser["status"]>("Active")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setName("")
    setEmail("")
    setRole("Customer")
    setStatus("Active")
  }

  const handleClose = () => {
    setOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Wire this up to a real admin "create user" action.
      onCreated?.({
        name,
        email,
        role,
        status,
      })
      handleClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Add user
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new user</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="create-user-name">Name</Label>
              <Input
                id="create-user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-user-email">Email</Label>
              <Input
                id="create-user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-user-role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) =>
                    setRole(value as AdminUser["role"])
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
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as AdminUser["status"])
                  }
                >
                  <SelectTrigger id="create-user-status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

