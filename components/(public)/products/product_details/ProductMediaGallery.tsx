'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ProductImage as ProductImageType } from '@/types/product_utf8'

interface ProductMediaGalleryProps {
  productName: string
  images: ProductImageType[]
  isFeatured?: boolean
  isTrending?: boolean
}

// Dummy images for demonstration
const DUMMY_IMAGES = [
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop',
]

/**
 * ProductMediaGallery Component
 * 
 * Maps to: product_images table
 * 
 * Features:
 * - Main image display with click-to-view
 * - Thumbnail navigation
 * - Full-screen image viewer
 * - Primary image prioritization
 * - Badge display for featured/trending
 */
export function ProductMediaGallery({
  productName,
  images,
  isFeatured,
  isTrending,
}: ProductMediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)

  // Sort images: primary first, then by creation date
  const sortedImages = useMemo(() => {
    const sorted = [...images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1
      if (!a.is_primary && b.is_primary) return 1
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    // If there's only one image or no images, add dummy images for demonstration
    if (sorted.length <= 1) {
      const primaryImage = sorted[0] || { 
        id: 'img-1', 
        url_image: '/placeholder-product.webp', 
        is_primary: true,
        product_id: '',
        created_at: new Date().toISOString()
      }
      
      // Add 3-4 dummy images
      const dummyImages = DUMMY_IMAGES.slice(0, 4).map((url, index) => ({
        id: `dummy-img-${index + 1}`,
        url_image: url,
        is_primary: false,
        product_id: primaryImage.product_id || '',
        created_at: new Date().toISOString()
      }))
      
      return [primaryImage, ...dummyImages]
    }

    return sorted
  }, [images])

  const currentImage = sortedImages[selectedIndex] || sortedImages[0]
  const currentImageUrl = currentImage?.url_image || '/placeholder-product.webp'

  if (sortedImages.length === 0) {
    return (
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted border">
        <Image
          src="/placeholder-product.webp"
          alt={productName}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-muted border group">
          <Image
            src={currentImageUrl}
            alt={productName}
            fill
            className="object-cover cursor-pointer transition-transform group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            onClick={() => setViewerOpen(true)}
          />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isFeatured && (
              <Badge className="bg-primary text-primary-foreground border-none">
                Featured
              </Badge>
            )}
            {isTrending && (
              <Badge className="bg-destructive text-destructive-foreground border-none">
                Trending
              </Badge>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {sortedImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {sortedImages.map((image, index) => {
              const isSelected = index === selectedIndex
              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "relative aspect-square w-24 h-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  )}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image
                    src={image.url_image}
                    alt={`${productName} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Full-Screen Viewer */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-transparent border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>View {productName} Image</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[80vh] rounded-lg overflow-hidden bg-background p-4">
            <Image
              src={currentImageUrl}
              alt={productName}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          {sortedImages.length > 1 && (
            <div className="flex gap-2 justify-center overflow-x-auto hide-scrollbar p-4 bg-background/95 backdrop-blur-sm">
              {sortedImages.map((image, index) => {
                const isSelected = index === selectedIndex
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={cn(
                      "relative aspect-square w-24 h-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                      isSelected
                        ? "border-primary ring-2 ring-primary/50"
                        : "border-border hover:border-primary/50"
                    )}
                    aria-label={`Select image ${index + 1}`}
                  >
                    <Image
                      src={image.url_image}
                      alt={`${productName} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="96px"
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
