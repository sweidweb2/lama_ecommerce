'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { toast } from "sonner"

interface SubmitCartButtonProps {
  cartId: string
  onSubmit?: (cartId: string) => void | Promise<void>
}

export function SubmitCartButton({ cartId, onSubmit }: SubmitCartButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(cartId)
      } else {
        // TODO: Implement submit cart action
        toast.info("Submit Cart", {
          description: "Submit cart functionality will be implemented soon.",
        })
      }
    } catch (error) {
      console.error("Error submitting cart:", error)
      toast.error("Error", {
        description: "Failed to submit cart. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      variant="default"
      size="sm"
      className="gap-2"
      onClick={handleSubmit}
      disabled={isSubmitting}
      aria-label={`Submit cart ${cartId}`}
    >
      <Send className="h-4 w-4" />
      {isSubmitting ? "Submitting..." : "Submit Cart"}
    </Button>
  )
}
