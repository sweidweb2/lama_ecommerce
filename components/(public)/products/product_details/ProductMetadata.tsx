'use client'

import { Separator } from '@/components/ui/separator'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ProductMetadataProps {
  sku: string | null
  slug: string | null
}

/**
 * ProductMetadata Component
 * 
 * Maps to: products.sku
 *          products.slug
 * 
 * Displays:
 * - SKU (Stock Keeping Unit)
 * - Product slug/URL
 * - Copy functionality for sharing
 */
export function ProductMetadata({ sku, slug }: ProductMetadataProps) {
  const handleCopySku = () => {
    if (sku) {
      navigator.clipboard.writeText(sku)
      toast.success('Copied', {
        description: 'SKU copied to clipboard',
      })
    }
  }

  const handleCopyLink = () => {
    if (slug) {
      const url = `${window.location.origin}/products/${slug}`
      navigator.clipboard.writeText(url)
      toast.success('Copied', {
        description: 'Product link copied to clipboard',
      })
    }
  }

  return (
    <div className="space-y-3 pt-4 border-t">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Product Information
      </h3>
      
      <div className="space-y-2 text-sm">
        {sku && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">SKU:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{sku}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopySku}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {slug && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Product ID:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">{slug}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
