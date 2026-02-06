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
import { Plus } from "lucide-react"

// Dummy users for selection
const DUMMY_USERS = [
  { id: "1", name: "John Doe", email: "john.doe@example.com" },
  { id: "2", name: "Jane Smith", email: "jane.smith@example.com" },
  { id: "3", name: "Bob Johnson", email: "bob.johnson@example.com" },
  { id: "4", name: "Alice Williams", email: "alice.williams@example.com" },
  { id: "5", name: "Charlie Brown", email: "charlie.brown@example.com" },
]

const NONE_VALUE = "__none__"

export function CreateCartDialog() {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string>(NONE_VALUE)
  const [sessionId, setSessionId] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation: user_id or session_id must be provided
    if (userId === NONE_VALUE && !sessionId.trim()) {
      alert("Please provide either a user or a session ID")
      return
    }

    // TODO: Wire this up to a real admin create action / API
    const newCart = {
      user_id: userId !== NONE_VALUE ? userId : null,
      session_id: sessionId.trim() || null,
    }

    console.log("Creating cart:", newCart)

    // Reset form
    setUserId(NONE_VALUE)
    setSessionId("")
    setOpen(false)
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
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger id="user-id">
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
                disabled={userId === NONE_VALUE && !sessionId.trim()}
              >
                Create Cart
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
