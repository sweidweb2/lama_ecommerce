"use client";

import { useState } from "react";
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
import { Edit } from "lucide-react";
import { updateLeadAction } from "@/actions/lead";
import { toast } from "sonner";
import type { AdminLead } from "./create_form";

interface EditLeadDialogProps {
  lead: AdminLead;
  onUpdated?: () => void;
}

export function EditLeadDialog({ lead, onUpdated }: EditLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(lead.email);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await updateLeadAction({ id: lead.id, email: email.trim() });
      if (result.success) {
        setOpen(false);
        onUpdated?.();
        toast.success("Lead updated");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEmail(lead.email);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Edit lead ${lead.email}`}
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor={`lead-email-${lead.id}`}>
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`lead-email-${lead.id}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lead@example.com"
                required
              />
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
