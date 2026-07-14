"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import type { AdminProductViewRow } from "@/repositories/product_view.repository";

interface ProductViewDetailsDialogProps {
  view: AdminProductViewRow;
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export function ProductViewDetailsDialog({
  view,
}: ProductViewDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const isGuest = !view.user_id;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`View details for product view ${view.id}`}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product View Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Viewer Type
                </p>
                <div className="mt-1">
                  <Badge variant={isGuest ? "secondary" : "default"}>
                    {isGuest ? "Guest" : "Logged In"}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Viewed At
                </p>
                <p className="mt-1 text-foreground">
                  {formatDate(view.viewed_at)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Product
              </p>
              <p className="mt-1 font-medium text-foreground">
                {view.product_name || "—"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  User Name
                </p>
                <p className="mt-1 text-foreground">
                  {view.user_name || "Guest / Anonymous"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  User ID
                </p>
                <p className="mt-1 font-mono text-xs break-all text-foreground">
                  {view.user_id || "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Session ID
              </p>
              <p className="mt-1 font-mono text-xs break-all text-foreground">
                {view.session_id || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                View ID
              </p>
              <p className="mt-1 font-mono text-xs break-all text-foreground">
                {view.id}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Product ID
              </p>
              <p className="mt-1 font-mono text-xs break-all text-foreground">
                {view.product_id}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
