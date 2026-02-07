'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ProductImage {
  id: string
  url_image: string
  is_primary?: boolean
}

interface ProductImageGalleryProps {
  productName: string
  images: ProductImage[]
}

// Dummy images for demonstration
const DUMMY_IMAGES = [
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
]

export function ProductImageGallery({ productName, images }: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  // Get all images, with primary first, and add dummy images if needed
  const allImages = useMemo(() => {
    const sortedImages = [...images].sort((a, b) => {
      if (a.is_primary) return -1
      if (b.is_primary) return 1
      return 0
    })

    // If there's only one image or no images, add dummy images for demonstration
    if (sortedImages.length <= 1) {
      const primaryImage = sortedImages[0] || { 
        id: 'img-1', 
        url_image: '/placeholder-product.webp', 
        is_primary: true 
      }
      
      // Add 3-4 dummy images
      const dummyImages = DUMMY_IMAGES.slice(0, 4).map((url, index) => ({
        id: `dummy-img-${index + 1}`,
        url_image: url,
        is_primary: index === 0,
      }))
      
      return [primaryImage, ...dummyImages]
    }

    return sortedImages
  }, [images])

  const currentImage = allImages[selectedImageIndex] || allImages[0]
  const currentImageUrl = currentImage?.url_image || '/placeholder-product.webp'

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
          <div className="relative w-full h-[80vh] rounded-lg overflow-hidden bg-background">
            <Image
              src={currentImageUrl}
              alt={productName}
              fill
              className="object-contain"
              sizes="100vw"
            />
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
