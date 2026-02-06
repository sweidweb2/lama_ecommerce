'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit } from "lucide-react"
import { DUMMY_BRANDS, DUMMY_CATEGORIES } from "@/lib/constants/dummy-data"

export type AdminProduct = {
  id: string
  name: string
  description?: string | null
  slug?: string | null
  brand_id?: string | null
  category_id?: string | null
  sku?: string | null
  price: number
  is_featured?: boolean
  is_trending?: boolean
  is_active?: boolean
  image?: string
}

interface EditProductDialogProps {
  product: AdminProduct
  showText?: boolean
}

const NONE_VALUE = "__none__"

export function EditProductDialog({ product, showText = false }: EditProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(product.description || "")
  const [slug, setSlug] = useState(product.slug || "")
  const [brandId, setBrandId] = useState(product.brand_id || NONE_VALUE)
  const [categoryId, setCategoryId] = useState(product.category_id || NONE_VALUE)
  const [sku, setSku] = useState(product.sku || "")
  const [price, setPrice] = useState(product.price.toString())
  const [isFeatured, setIsFeatured] = useState(product.is_featured ?? false)
  const [isTrending, setIsTrending] = useState(product.is_trending ?? false)
  const [isActive, setIsActive] = useState(product.is_active ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // TODO: Wire this up to a real admin update action / API
    // For now we just simulate success and close the dialog after "saving".
    setOpen(false)
  }

  const handleCancel = () => {
    // Reset to original values on cancel
    setName(product.name)
    setDescription(product.description || "")
    setSlug(product.slug || "")
    setBrandId(product.brand_id || NONE_VALUE)
    setCategoryId(product.category_id || NONE_VALUE)
    setSku(product.sku || "")
    setPrice(product.price.toString())
    setIsFeatured(product.is_featured ?? false)
    setIsTrending(product.is_trending ?? false)
    setIsActive(product.is_active ?? true)
    setOpen(false)
  }

  return (
    <>
      <Button
        variant={showText ? "outline" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Edit ${product.name}`}
      >
        <Edit className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Edit"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor={`product-name-${product.id}`}>
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`product-name-${product.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`product-slug-${product.id}`}>Slug</Label>
              <Input
                id={`product-slug-${product.id}`}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="product-slug"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`product-description-${product.id}`}>Description</Label>
              <textarea
                id={`product-description-${product.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:border-[1.5px] disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter product description"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`product-brand-${product.id}`}>Brand</Label>
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger id={`product-brand-${product.id}`} className="w-full">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {DUMMY_BRANDS.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`product-category-${product.id}`}>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id={`product-category-${product.id}`} className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {DUMMY_CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`product-sku-${product.id}`}>SKU</Label>
                <Input
                  id={`product-sku-${product.id}`}
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="PROD-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`product-price-${product.id}`}>
                  Price <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`product-price-${product.id}`}
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`product-featured-${product.id}`}
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor={`product-featured-${product.id}`} className="cursor-pointer">
                  Featured Product
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`product-trending-${product.id}`}
                  checked={isTrending}
                  onChange={(e) => setIsTrending(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor={`product-trending-${product.id}`} className="cursor-pointer">
                  Trending Product
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`product-active-${product.id}`}
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor={`product-active-${product.id}`} className="cursor-pointer">
                  Active (Visible to customers)
                </Label>
              </div>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
