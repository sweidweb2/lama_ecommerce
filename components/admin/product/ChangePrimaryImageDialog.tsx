'use client'

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Star } from "lucide-react"
import { changePrimaryProductImageAction } from "@/actions/product"

interface ProductImage {
  id: string
  url_image: string
  is_primary?: boolean
}

interface ChangePrimaryImageDialogProps {
  productId: string
  images: ProductImage[]
}

export function ChangePrimaryImageDialog({
  productId,
  images,
}: ChangePrimaryImageDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

  const currentPrimaryId = useMemo(
    () => images.find((img) => img.is_primary)?.id ?? null,
    [images],
  )

  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1
      if (!a.is_primary && b.is_primary) return 1
      return 0
    })
  }, [images])

  const canSubmit =
    !!selectedImageId &&
    (!currentPrimaryId || selectedImageId !== currentPrimaryId)

  const handleSubmit = async () => {
    if (!canSubmit || !selectedImageId) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set("product_id", productId)
      formData.set("image_id", selectedImageId)

      await changePrimaryProductImageAction(formData)
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error changing primary image:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (images.length === 0) {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        Change Primary
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Change Primary Image</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {currentPrimaryId && (
              <div className="rounded-lg border bg-muted/40 p-3 flex items-center gap-3">
                <div className="relative h-16 w-16 rounded-md overflow-hidden border bg-background">
                  {sortedImages[0] && (
                    <Image
                      src={sortedImages[0].url_image}
                      alt="Current primary image"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
                    <Star className="h-3 w-3" />
                    <span>Current primary</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select another image below to set a new primary image.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sortedImages.map((image) => {
                const isSelected = selectedImageId === image.id
                const isCurrentPrimary = image.id === currentPrimaryId

                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImageId(image.id)}
                    className={cn(
                      "relative aspect-square w-full rounded-lg overflow-hidden border-2 transition-all",
                      isSelected
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border hover:border-primary/60",
                    )}
                  >
                    <Image
                      src={image.url_image}
                      alt="Product image"
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                    {isCurrentPrimary && (
                      <div className="absolute top-1 left-1 inline-flex items-center gap-1 rounded-full bg-primary/90 text-primary-foreground px-1.5 py-0.5 text-[9px] font-semibold shadow-sm">
                        <Star className="h-2.5 w-2.5 fill-primary-foreground" />
                        <span>Primary</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!canSubmit}
            >
              Change Primary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

