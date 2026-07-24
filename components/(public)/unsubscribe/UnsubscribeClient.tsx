"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { unsubscribeLeadAction } from "@/actions/lead";

interface UnsubscribeClientProps {
  token: string;
}

export function UnsubscribeClient({ token }: UnsubscribeClientProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    token ? null : "Missing unsubscribe link. Please use the link from your email.",
  );
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await unsubscribeLeadAction(token);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDone(true);
      setMessage(
        result.alreadyUnsubscribed
          ? "You were already unsubscribed from our list."
          : "You have been unsubscribed from our list.",
      );
    });
  };

  if (done && message) {
    return (
      <div className="rounded-lg border bg-muted/30 p-6 space-y-2">
        <p className="font-medium text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">
          You will not receive list emails from us unless you sign up again.
        </p>
      </div>
    );
  }

  if (error && !token) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <p className="text-sm text-muted-foreground">
        Confirm that you want to leave the Aviora Wear email list.
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        type="button"
        onClick={handleConfirm}
        loading={isPending}
        disabled={!token}
      >
        Confirm unsubscribe
      </Button>
    </div>
  );
}
