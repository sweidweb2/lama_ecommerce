'use client'

import { useState, useEffect } from "react"
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
import { Plus } from "lucide-react"
import { getUsersWithoutActiveCartsAction } from "@/actions/profile"
import { createCartAction } from "@/actions/cart"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { AdminProfileRow } from "@/repositories/profile.repository"

const NONE_VALUE = "__none__"

export function CreateCartDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string>(NONE_VALUE)
  const [sessionId, setSessionId] = useState<string>("")
  const [users, setUsers] = useState<AdminProfileRow[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch users without active carts when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoadingUsers(true)
      getUsersWithoutActiveCartsAction()
        .then((fetchedUsers) => {
          setUsers(fetchedUsers || [])
        })
        .catch((error) => {
          console.error("Error fetching users:", error)
          setUsers([])
        })
        .finally(() => {
          setIsLoadingUsers(false)
        })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation: user_id or session_id must be provided
    if (userId === NONE_VALUE && !sessionId.trim()) {
      toast.error("Error", {
        description: "Please provide either a user or a session ID",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createCartAction({
        user_id: userId !== NONE_VALUE ? userId : null,
        session_id: sessionId.trim() || null,
      })

      if (result.success) {
        toast.success("Success", {
          description: "Cart created successfully",
        })
        // Reset form
        setUserId(NONE_VALUE)
        setSessionId("")
        setOpen(false)
        // Refresh the page to show the new cart
        router.refresh()
      } else {
        toast.error("Error", {
          description: result.error || "Failed to create cart",
        })
      }
    } catch (error) {
      console.error("Error creating cart:", error)
      toast.error("Error", {
        description: "An unexpected error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setUserId(NONE_VALUE)
    setSessionId("")
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Cart
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Cart</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="user-id">
                User <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Select value={userId} onValueChange={setUserId} disabled={isLoadingUsers}>
                <SelectTrigger id="user-id">
                  <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user"} />
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
                  Showing {users.length} user{users.length !== 1 ? 's' : ''} without active carts
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-id">
                Session ID <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="session-id"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter session ID"
              />
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <p>Note: At least one of User or Session ID must be provided.</p>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={(userId === NONE_VALUE && !sessionId.trim()) || isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Cart"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
