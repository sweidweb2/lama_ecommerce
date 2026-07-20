"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Loader2 } from "lucide-react";
import { updateShipmentAction } from "@/actions/shipment";
import { toast } from "sonner";
import type { Shipment } from "@/types/order";

interface EditShipmentDialogProps {
  shipment: Shipment;
  showText?: boolean;
}

export function EditShipmentDialog({
  shipment,
  showText = false,
}: EditShipmentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [carrierName, setCarrierName] = useState(shipment.carrier_name ?? "");
  const [trackingNumber, setTrackingNumber] = useState(
    shipment.tracking_number ?? "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setCarrierName(shipment.carrier_name ?? "");
      setTrackingNumber(shipment.tracking_number ?? "");
    } else {
      setCarrierName(shipment.carrier_name ?? "");
      setTrackingNumber(shipment.tracking_number ?? "");
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const carrier = carrierName.trim();
    const tracking = trackingNumber.trim();

    if (!carrier || !tracking) {
      toast.error("Carrier and tracking number are required");
      return;
    }

    if (
      carrier === (shipment.carrier_name ?? "").trim() &&
      tracking === (shipment.tracking_number ?? "").trim()
    ) {
      toast.info("No changes");
      setOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateShipmentAction(shipment.id, shipment.order_id, {
        carrier_name: carrier,
        tracking_number: tracking,
      });

      if (result.success) {
        toast.success("Shipment updated");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update shipment");
      }
    } catch (error) {
      console.error("Error updating shipment:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant={showText ? "outline" : "ghost"}
        size={showText ? "sm" : "icon"}
        onClick={() => handleOpenChange(true)}
        aria-label="Edit shipment"
        title="Edit shipment"
      >
        <Edit className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Edit"}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shipment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor={`carrier-${shipment.id}`}>
                Carrier <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`carrier-${shipment.id}`}
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                disabled={isSubmitting}
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`tracking-${shipment.id}`}>
                Tracking Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`tracking-${shipment.id}`}
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                disabled={isSubmitting}
                maxLength={100}
                required
              />
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
