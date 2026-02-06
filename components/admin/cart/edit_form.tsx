'use client'

import { useState } from "react"
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

// Dummy users for selection
const DUMMY_USERS = [
  { id: "1", name: "John Doe", email: "john.doe@example.com" },
  { id: "2", name: "Jane Smith", email: "jane.smith@example.com" },
  { id: "3", name: "Bob Johnson", email: "bob.johnson@example.com" },
  { id: "4", name: "Alice Williams", email: "alice.williams@example.com" },
  { id: "5", name: "Charlie Brown", email: "charlie.brown@example.com" },
]

export type AdminCart = {
  id: string
  user_id?: string | null
  session_id?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

interface EditCartDialogProps {
  cart: AdminCart
  showText?: boolean
}

const NONE_VALUE = "__none__"

export function EditCartDialog({ cart, showText = false }: EditCartDialogProps) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string>(cart.user_id || NONE_VALUE)
  const [sessionId, setSessionId] = useState<string>(cart.session_id || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation: user_id or session_id must be provided
    if (userId === NONE_VALUE && !sessionId.trim()) {
      alert("Please provide either a user or a session ID")
      return
    }

    // TODO: Wire this up to a real admin update action / API
    const updatedCart = {
      id: cart.id,
      user_id: userId !== NONE_VALUE ? userId : null,
      session_id: sessionId.trim() || null,
    }

    console.log("Updating cart:", updatedCart)

    setOpen(false)
  }

  const handleCancel = () => {
    // Reset to original values
    setUserId(cart.user_id || NONE_VALUE)
    setSessionId(cart.session_id || "")
    setOpen(false)
  }

  return (
    <>
      <Button
        variant={showText ? "outline" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Edit cart ${cart.id}`}
      >
        <Edit className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Edit"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cart</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor={`user-id-${cart.id}`}>
                User <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger id={`user-id-${cart.id}`}>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {DUMMY_USERS.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`session-id-${cart.id}`}>
                Session ID <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id={`session-id-${cart.id}`}
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
                disabled={userId === NONE_VALUE && !sessionId.trim()}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
