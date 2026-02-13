'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

interface ProductImage {
  id: string
  url_image: string
  is_primary?: boolean
}

interface ProductImageGalleryProps {
  productName: string
  images: ProductImage[]
}

export function ProductImageGallery({ productName, images }: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  // Get all images, with primary first
  const allImages = useMemo(() => {
    const sortedImages = [...images].sort((a, b) => {
      if (a.is_primary) return -1
      if (b.is_primary) return 1
      return 0
    })

    return sortedImages
  }, [images])

  const currentImage = allImages[selectedImageIndex] || allImages[0]
  const currentImageUrl = currentImage?.url_image || '/placeholder-product.webp'
  const isCurrentPrimary = !!currentImage?.is_primary

  if (allImages.length === 0) {
    return (
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted border">
        <Image
          src="/placeholder-product.webp"
          alt={productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 320px"
        />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div
          className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted border cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setViewDialogOpen(true)}
        >
          <Image
            src={currentImageUrl}
            alt={productName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 320px"
          />

          {isCurrentPrimary && (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary/90 text-primary-foreground px-2 py-0.5 text-[10px] font-semibold shadow-sm">
              <Star className="h-3 w-3 fill-primary-foreground" />
              <span>Primary</span>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {allImages.map((image, index) => {
              const isSelected = index === selectedImageIndex
              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative aspect-square w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                    isSelected
                      ? "border-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Image
                    src={image.url_image}
                    alt={`${productName} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                  {image.is_primary && (
                    <div className="absolute top-1 left-1 rounded-full bg-primary/90 text-primary-foreground px-1.5 py-0.5 text-[9px] font-semibold flex items-center gap-1 shadow-sm">
                      <Star className="h-2.5 w-2.5 fill-primary-foreground" />
                      <span>Primary</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-transparent border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>View {productName} Image</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[80vh] rounded-lg overflow-hidden bg-background p-4">
            <Image
              src={currentImageUrl}
              alt={productName}
              fill
              className="object-cover rounded-md"
              sizes="100vw"
            />
            {isCurrentPrimary && (
              <div className="absolute top-6 left-6 flex items-center gap-1 rounded-full bg-primary/90 text-primary-foreground px-3 py-1 text-xs font-semibold shadow-sm">
                <Star className="h-3.5 w-3.5 fill-primary-foreground" />
                <span>Primary</span>
              </div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 justify-center overflow-x-auto hide-scrollbar p-4 bg-background/95 backdrop-blur-sm">
              {allImages.map((image, index) => {
                const isSelected = index === selectedImageIndex
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "relative aspect-square w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                      isSelected
                        ? "border-primary ring-2 ring-primary/50"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Image
                      src={image.url_image}
                      alt={`${productName} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
