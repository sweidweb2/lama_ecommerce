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
import { Trash2 } from "lucide-react";
import type { AdminLead } from "./create_form";

interface DeleteLeadDialogProps {
  lead: Pick<AdminLead, "id" | "email">;
  onDelete?: (leadId: string) => void | Promise<void>;
  showText?: boolean;
}

export function DeleteLeadDialog({
  lead,
  onDelete,
  showText = false,
}: DeleteLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(lead.id);
      }
      setOpen(false);
    } catch (error) {
      console.error("Error deleting lead:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant={showText ? "destructive" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Delete lead ${lead.email}`}
      >
        <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to delete the lead{" "}
              <span className="font-semibold text-foreground">{lead.email}</span>
              ?
            </p>
            <p>This action cannot be undone.</p>
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
