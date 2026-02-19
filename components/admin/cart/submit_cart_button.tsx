'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { CheckoutDialog } from "./CheckoutDialog"

interface SubmitCartButtonProps {
  cartId: string
  onSubmit?: (cartId: string) => void | Promise<void>
}

export function SubmitCartButton({ cartId, onSubmit }: SubmitCartButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSuccess = async () => {
    if (onSubmit) {
      await onSubmit(cartId)
    }
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="gap-2"
        onClick={() => setDialogOpen(true)}
        aria-label={`Submit cart ${cartId}`}
      >
        <Send className="h-4 w-4" />
        Submit Cart
      </Button>

      <CheckoutDialog
        cartId={cartId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </>
  )
}
