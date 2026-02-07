'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

export type AdminShippingZone = {
  id: string
  name: string
  estimated_time: string | null
  fee: number | null
  created_at?: string
}

interface CreateShippingZoneDialogProps {
  onCreated?: () => void
}

export function CreateShippingZoneDialog({ onCreated }: CreateShippingZoneDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [fee, setFee] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newZone = {
      name: name.trim(),
      estimated_time: estimatedTime.trim() || null,
      fee: fee ? parseFloat(fee) : null,
    }

    try {
      // TODO: Wire this up to a real admin create action / API
      // The backend should create both shipping_zone and shipping_fee entities
      const response = await fetch("/api/admin/shipping-zones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newZone),
      })

      if (!response.ok) {
        throw new Error("Failed to create shipping zone")
      }

      // Reset form
      setName("")
      setEstimatedTime("")
      setFee("")
      setOpen(false)
      onCreated?.()
    } catch (error) {
      console.error("Error creating shipping zone:", error)
      // TODO: Show error toast
    }
  }

  const handleCancel = () => {
    setName("")
    setEstimatedTime("")
    setFee("")
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Shipping Zone
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Shipping Zone</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="zone-name">
                Zone Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="zone-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., United States, Europe, Asia"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated-time">Estimated Delivery Time</Label>
              <Input
                id="estimated-time"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g., 5-7 business days, 2-3 weeks"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping-fee">
                Shipping Fee <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shipping-fee"
                type="number"
                step="0.01"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the shipping fee for this zone
              </p>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Zone
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
