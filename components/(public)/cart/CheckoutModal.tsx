"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type CheckoutModalStatus = "processing" | "success" | "error";

interface CheckoutModalProps {
  open: boolean;
  status: CheckoutModalStatus;
  errorMessage?: string;
}

const statusConfig: Record<
  CheckoutModalStatus,
  { title: string; icon: React.ReactNode; description: string }
> = {
  processing: {
    title: "Processing Your Order",
    icon: <Loader2 className="h-12 w-12 animate-spin text-primary" />,
    description: "Please wait while we process your payment and create your order…",
  },
  success: {
    title: "Order Placed Successfully!",
    icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
    description: "Your order has been created. Redirecting you shortly…",
  },
  error: {
    title: "Checkout Failed",
    icon: <XCircle className="h-12 w-12 text-destructive" />,
    description: "",
  },
};

export function CheckoutModal({ open, status, errorMessage }: CheckoutModalProps) {
  const [dots, setDots] = useState("");

  // Animate dots for processing state
  useEffect(() => {
    if (status !== "processing") return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [status]);

  const config = statusConfig[status];

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-sm text-center [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center space-y-4 pt-2">
          <div className="flex items-center justify-center">{config.icon}</div>
          <DialogTitle className="text-lg font-bold">
            {config.title}
            {status === "processing" && dots}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {status === "error"
              ? errorMessage || "Something went wrong. Please try again."
              : config.description}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
