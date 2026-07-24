'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Star, Trash2, ImageIcon } from 'lucide-react'
import { deleteProductImageAction } from '@/actions/product'

interface ProductImage {
  id: string
  url_image: string
  is_primary?: boolean
}

interface ProductImageGalleryProps {
  productId: string
  productName: string
  images: ProductImage[]
}

export function ProductImageGallery({ productId, productName, images }: ProductImageGalleryProps) {
  const router = useRouter()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
  const currentImageUrl = currentImage?.url_image
  const isCurrentPrimary = !!currentImage?.is_primary
  const hasImage = !!currentImageUrl

  const handleConfirmDelete = async () => {
    if (!currentImage) return

    setIsDeleting(true)
    try {
      const formData = new FormData()
      formData.set('product_id', productId)
      formData.set('image_id', currentImage.id)

      await deleteProductImageAction(formData)
      setDeleteDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting product image:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (allImages.length === 0) {
    return (
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted border flex items-center justify-center p-4">
        <Skeleton className="w-24 h-24 rounded-md flex items-center justify-center bg-muted-foreground/15">
          <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
        </Skeleton>
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
          {hasImage ? (
            <Image
              src={currentImageUrl}
              alt={productName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-16 w-16 opacity-50" />
                <span className="text-sm opacity-75">No Image Available</span>
              </div>
            </div>
          )}

          {isCurrentPrimary && (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary/90 text-primary-foreground px-2 py-0.5 text-[10px] font-semibold shadow-sm">
              <Star className="h-3 w-3 fill-primary-foreground" />
              <span>Primary</span>
            </div>
          )}

          {currentImage && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-sm !bg-red-600 !hover:bg-red-700 !text-white"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
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
            {hasImage ? (
              <Image
                src={currentImageUrl}
                alt={productName}
                fill
                className="object-cover rounded-md"
                sizes="100vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-16 w-16 opacity-50" />
                  <span className="text-sm opacity-75">No Image Available</span>
                </div>
              </div>
            )}
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

      {/* Delete Image Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this product image?</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3 text-sm text-muted-foreground">
            <p>
              Are you sure you want to delete this image for{' '}
              <span className="font-semibold text-foreground">{productName}</span>?
            </p>
            {isCurrentPrimary && (
              <p>
                This is the current <span className="font-semibold text-foreground">primary</span> image.
                If you delete it, another image (if available) will be promoted as primary automatically.
              </p>
            )}
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="!bg-red-600 !hover:bg-red-700 !text-white"
              onClick={handleConfirmDelete}
              loading={isDeleting}
            >
              Delete Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
