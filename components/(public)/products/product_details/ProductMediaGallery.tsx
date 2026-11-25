'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, ImageIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  ProductImage as ProductImageType,
  ProductVariant,
} from '@/types/product'
import { useProductVariant } from './ProductVariantProvider'

interface ProductMediaGalleryProps {
  productName: string
  images: ProductImageType[]
  variants?: ProductVariant[]
  isFeatured?: boolean
  isTrending?: boolean
}

function resolvePreferredIndex(
  sortedImages: ProductImageType[],
  selectedVariantId: string | null | undefined,
  selectedColor: string | null | undefined,
  variantById: Map<string, ProductVariant>,
): number {
  if (sortedImages.length === 0) return 0

  let nextIndex = -1

  if (selectedVariantId) {
    nextIndex = sortedImages.findIndex(
      (img) => img.customised_product_id === selectedVariantId,
    )
  }

  if (nextIndex < 0 && selectedColor) {
    nextIndex = sortedImages.findIndex((img) => {
      if (!img.customised_product_id) return false
      const linked = variantById.get(img.customised_product_id)
      return linked?.color === selectedColor
    })
  }

  if (nextIndex < 0) {
    nextIndex = sortedImages.findIndex((img) => img.is_primary)
  }

  return nextIndex < 0 ? 0 : nextIndex
}

/**
 * Product media gallery with thumbnail strip and full-screen lightbox viewer.
 * Swaps to a variant-assigned image when color / variant selection changes.
 */
export function ProductMediaGallery({
  productName,
  images,
  variants = [],
  isFeatured,
  isTrending,
}: ProductMediaGalleryProps) {
  const { selectedVariantId, selectedColor } = useProductVariant()
  const [manualIndex, setManualIndex] = useState<number | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)

  const sortedImages = useMemo(() => {
    return [...images]
      .filter((img) => img.url_image)
      .sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
  }, [images])

  const variantById = useMemo(() => {
    return new Map(variants.map((v) => [v.id, v]))
  }, [variants])

  const selectionKey = `${selectedVariantId ?? ''}\0${selectedColor ?? ''}`
  const [seenSelectionKey, setSeenSelectionKey] = useState(selectionKey)

  // Clear manual thumbnail picks when variant/color selection changes (derived state).
  if (selectionKey !== seenSelectionKey) {
    setSeenSelectionKey(selectionKey)
    setManualIndex(null)
  }

  const preferredIndex = useMemo(
    () =>
      resolvePreferredIndex(
        sortedImages,
        selectedVariantId,
        selectedColor,
        variantById,
      ),
    [sortedImages, selectedVariantId, selectedColor, variantById],
  )

  const imageCount = sortedImages.length
  const rawIndex = manualIndex ?? preferredIndex
  const selectedIndex =
    imageCount === 0 ? 0 : Math.min(Math.max(rawIndex, 0), imageCount - 1)

  const currentImage = sortedImages[selectedIndex] || sortedImages[0]
  const hasImage = Boolean(currentImage?.url_image)
  const canNavigate = imageCount > 1

  const goTo = useCallback(
    (index: number) => {
      if (imageCount === 0) return
      setManualIndex(((index % imageCount) + imageCount) % imageCount)
    },
    [imageCount],
  )

  const goPrev = useCallback(() => goTo(selectedIndex - 1), [goTo, selectedIndex])
  const goNext = useCallback(() => goTo(selectedIndex + 1), [goTo, selectedIndex])

  useEffect(() => {
    if (!viewerOpen || !canNavigate) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [viewerOpen, canNavigate, goPrev, goNext])

  if (sortedImages.length === 0 || !hasImage) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageIcon className="h-16 w-16 opacity-50" />
          <span className="text-sm opacity-75">No Image Available</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted group">
          <Image
            src={currentImage.url_image}
            alt={productName}
            fill
            className="object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            onClick={() => setViewerOpen(true)}
          />

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

        {imageCount > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {sortedImages.map((image, index) => {
              const isSelected = index === selectedIndex
              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setManualIndex(index)}
                  className={cn(
                    'relative aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50',
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

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            'fixed inset-0 left-0 top-0 z-50 flex h-dvh max-h-dvh w-screen max-w-none',
            'translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0',
            'bg-[#14110e]/95 p-0 shadow-none outline-none backdrop-blur-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200',
          )}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>View {productName} images</DialogTitle>
          </DialogHeader>

          {/* Top bar */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-4 pt-4 sm:px-6 sm:pt-5">
            <div className="pointer-events-auto max-w-[60%] truncate rounded-full bg-black/40 px-3 py-1.5 text-xs tracking-wide text-white/80 backdrop-blur-sm sm:text-sm">
              <span className="font-medium text-white/95">{productName}</span>
              {canNavigate && (
                <span className="ml-2 text-white/55">
                  {selectedIndex + 1} / {imageCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Close image viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main stage */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-28 pt-16 sm:px-16 sm:pb-32 sm:pt-20">
            {canNavigate && (
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 z-10 hidden h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20 sm:left-4 sm:inline-flex"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <div className="relative h-full w-full max-w-5xl">
              <Image
                key={currentImage.id}
                src={currentImage.url_image}
                alt={productName}
                fill
                className="object-contain animate-in fade-in-0 duration-200"
                sizes="100vw"
                priority
              />
            </div>

            {canNavigate && (
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 z-10 hidden h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20 sm:right-4 sm:inline-flex"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Filmstrip */}
          {canNavigate && (
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pb-5 pt-10 sm:px-6 sm:pb-6">
              <div className="mx-auto flex max-w-3xl justify-center gap-2 overflow-x-auto hide-scrollbar">
                {sortedImages.map((image, index) => {
                  const isSelected = index === selectedIndex
                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setManualIndex(index)}
                      className={cn(
                        'relative h-14 w-14 shrink-0 overflow-hidden rounded-md transition-all sm:h-16 sm:w-16',
                        isSelected
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-black/80'
                          : 'opacity-55 hover:opacity-100',
                      )}
                      aria-label={`Select image ${index + 1}`}
                      aria-current={isSelected ? 'true' : undefined}
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

              {/* Mobile prev/next */}
              <div className="mt-4 flex items-center justify-center gap-3 sm:hidden">
                <button
                  type="button"
                  onClick={goPrev}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/90"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="min-w-12 text-center text-xs text-white/70">
                  {selectedIndex + 1} / {imageCount}
                </span>
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/90"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
