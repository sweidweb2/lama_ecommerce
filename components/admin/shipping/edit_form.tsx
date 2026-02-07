'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit } from "lucide-react"
import type { AdminShippingZone } from "./create_form"

interface EditShippingZoneDialogProps {
  zone: AdminShippingZone
  onUpdated?: () => void
}

export function EditShippingZoneDialog({ zone, onUpdated }: EditShippingZoneDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(zone.name)
  const [estimatedTime, setEstimatedTime] = useState(zone.estimated_time || "")
  const [fee, setFee] = useState(zone.fee?.toString() || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const updatedZone = {
      id: zone.id,
      name: name.trim(),
      estimated_time: estimatedTime.trim() || null,
      fee: fee ? parseFloat(fee) : null,
    }

    try {
      // TODO: Wire this up to a real admin update action / API
      // The backend should update both shipping_zone and shipping_fee entities
      const response = await fetch(`/api/admin/shipping-zones/${zone.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedZone),
      })

      if (!response.ok) {
        throw new Error("Failed to update shipping zone")
      }

      setOpen(false)
      onUpdated?.()
    } catch (error) {
      console.error("Error updating shipping zone:", error)
      // TODO: Show error toast
    }
  }

  const handleCancel = () => {
    setName(zone.name)
    setEstimatedTime(zone.estimated_time || "")
    setFee(zone.fee?.toString() || "")
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Edit shipping zone ${zone.name}`}
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Shipping Zone</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor={`zone-name-${zone.id}`}>
                Zone Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`zone-name-${zone.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., United States, Europe, Asia"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`estimated-time-${zone.id}`}>Estimated Delivery Time</Label>
              <Input
                id={`estimated-time-${zone.id}`}
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g., 5-7 business days, 2-3 weeks"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`shipping-fee-${zone.id}`}>
                Shipping Fee <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`shipping-fee-${zone.id}`}
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
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
