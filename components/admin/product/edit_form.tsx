'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit } from "lucide-react"
import type { Brand, Category } from "@/types/product"
import { z } from "zod"
import { updateProductAction } from "@/actions/product";
import { createProductSchema } from "@/lib/validators/product/create"

export type AdminProduct = {
  id: string
  name: string
  description?: string | null
  slug: string
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
  brands: Brand[]
  categories: Category[]
}

const NONE_VALUE = "__none__"

export function EditProductDialog({
  product,
  showText = false,
  brands = [],
  categories = [],
}: EditProductDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(product.description || "")
  const [slug, setSlug] = useState(product.slug)
  const [brandId, setBrandId] = useState(product.brand_id || NONE_VALUE)
  const [categoryId, setCategoryId] = useState(product.category_id || NONE_VALUE)
  const [sku, setSku] = useState(product.sku || "")
  const [price, setPrice] = useState(product.price.toString())
  const [isFeatured, setIsFeatured] = useState(product.is_featured ?? false)
  const [isTrending, setIsTrending] = useState(product.is_trending ?? false)
  const [isActive, setIsActive] = useState(product.is_active ?? true)
  const [errors, setErrors] = useState<
    Partial<Record<keyof z.input<typeof createProductSchema>, string>>
  >({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const trimmedDescription = description.trim()
    const trimmedSlug = slug.trim()
    const trimmedSku = sku.trim()

    const candidate: z.input<typeof createProductSchema> = {
      name: trimmedName,
      description: trimmedDescription ? trimmedDescription : null,
      slug: trimmedSlug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 40),
      brand_id: brandId === NONE_VALUE ? null : brandId,
      category_id: categoryId === NONE_VALUE ? null : categoryId,
      sku: trimmedSku ? trimmedSku.toUpperCase().slice(0, 32) : null,
      price: price ? Number(price) : NaN,
      is_featured: isFeatured,
      is_trending: isTrending,
      is_active: isActive,
    }

    const parsed = createProductSchema.safeParse(candidate)

    if (!parsed.success) {
      const fieldErrors: Partial<
        Record<keyof z.input<typeof createProductSchema>, string>
      > = {}

      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof z.input<typeof createProductSchema>
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message
        }
      }

      setErrors(fieldErrors)
      return
    }

    setErrors({})

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set("id", product.id)
      formData.set("name", parsed.data.name)
      formData.set("description", parsed.data.description ?? "")
      formData.set("slug", parsed.data.slug)
      formData.set("brand_id", parsed.data.brand_id ?? "")
      formData.set("category_id", parsed.data.category_id ?? "")
      formData.set("sku", parsed.data.sku ?? "")
      formData.set("price", parsed.data.price.toString())
      formData.set("is_featured", parsed.data.is_featured ? "true" : "false")
      formData.set("is_trending", parsed.data.is_trending ? "true" : "false")
      formData.set("is_active", parsed.data.is_active ? "true" : "false")

      await updateProductAction(formData)

      // Refresh the current page to show updated data.
      // The route uses the product ID which never changes.
      router.refresh()

      setOpen(false)
    } catch (error) {
      console.error("Error updating product:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset to original values on cancel
    setName(product.name)
    setDescription(product.description || "")
    setSlug(product.slug)
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
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`product-slug-${product.id}`}>
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`product-slug-${product.id}`}
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "")
                      .slice(0, 40),
                  )
                }
                placeholder="product-slug"
                maxLength={40}
                required
              />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`product-description-${product.id}`}>Description</Label>
              <Textarea
                id={`product-description-${product.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
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
                    {brands.map((brand) => (
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
                    {categories.map((category) => (
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
                onChange={(e) => setSku(e.target.value.toUpperCase().slice(0, 32))}
                  placeholder="PROD-001"
                />
              {errors.sku && (
                <p className="text-xs text-destructive">{errors.sku}</p>
              )}
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
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price}</p>
              )}
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
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
