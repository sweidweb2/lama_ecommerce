'use client'

import { useState } from "react"
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
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import Link from "@/components/ui/link"
import type { Brand, Category } from "@/types/product"
import { createProductSchema } from "@/lib/validators/product/create"
import type { z } from "zod"

const NONE_VALUE = "__none__"

interface CreateProductFormProps {
  action: (formData: FormData) => Promise<void> | void
  brands: Brand[]
  categories: Category[]
}

type CreateProductSchemaInput = z.input<typeof createProductSchema>

export function CreateProductForm({
  action,
  brands,
  categories,
}: CreateProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [slug, setSlug] = useState("")
  const [brandId, setBrandId] = useState(NONE_VALUE)
  const [categoryId, setCategoryId] = useState(NONE_VALUE)
  const [sku, setSku] = useState("")
  const [price, setPrice] = useState("")
  const [isFeatured, setIsFeatured] = useState(false)
  const [isTrending, setIsTrending] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<Partial<Record<keyof CreateProductSchemaInput, string>>>(
    {},
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const trimmedDescription = description.trim()
    const trimmedSlug = slug.trim()
    const trimmedSku = sku.trim()

    const candidate: CreateProductSchemaInput = {
      name: trimmedName,
      description: trimmedDescription ? trimmedDescription : null,
      slug: trimmedSlug ? trimmedSlug : null,
      brand_id: brandId === NONE_VALUE ? null : brandId,
      category_id: categoryId === NONE_VALUE ? null : categoryId,
      sku: trimmedSku ? trimmedSku.toUpperCase() : null,
      price: price ? Number(price) : NaN,
      is_featured: isFeatured,
      is_trending: isTrending,
      is_active: isActive,
    }

    const parsed = createProductSchema.safeParse(candidate)

    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof CreateProductSchemaInput, string>> = {}
      for (const issue of parsed.error.issues) {
        const pathKey = issue.path[0] as keyof CreateProductSchemaInput
        if (pathKey && !fieldErrors[pathKey]) {
          fieldErrors[pathKey] = issue.message
        }
      }
      setErrors(fieldErrors)
      toast.error("Please fix the highlighted errors and try again.")
      return
    }

    setErrors({})

    setIsSubmitting(true)
    try {
      const form = e.currentTarget
      const formData = new FormData(form)

      formData.set("name", parsed.data.name)
      formData.set("description", parsed.data.description ?? "")
      formData.set("slug", parsed.data.slug ?? "")
      formData.set("brand_id", parsed.data.brand_id ?? "")
      formData.set("category_id", parsed.data.category_id ?? "")
      formData.set("sku", parsed.data.sku ?? "")
      formData.set("price", parsed.data.price.toString())
      formData.set("is_featured", parsed.data.is_featured ? "true" : "false")
      formData.set("is_trending", parsed.data.is_trending ? "true" : "false")
      formData.set("is_active", parsed.data.is_active ? "true" : "false")

      await action(formData)

      toast.success("Product created successfully!")

      setName("")
      setDescription("")
      setSlug("")
      setBrandId(NONE_VALUE)
      setCategoryId(NONE_VALUE)
      setSku("")
      setPrice("")
      setIsFeatured(false)
      setIsTrending(false)
      setIsActive(true)
    } catch (error) {
      toast.error("Failed to create product")
      console.error("Error creating product:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Create Product</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Add a new product to your catalog
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
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
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
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
            />
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
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
              <Label htmlFor="brand">Brand</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger id="brand" className="w-full">
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
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category" className="w-full">
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

          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="images">Product Image</Label>
            <Input
              id="images"
              name="images"
              type="file"
              accept="image/*"
            />
            <p className="text-xs text-muted-foreground">
              Optional. You can add more images later from the product details page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase().slice(0, 32))}
                placeholder="PROD-001"
              />
              {errors.sku && (
                <p className="text-xs text-destructive">{errors.sku}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                Price <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                name="price"
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
                id="featured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Featured Product
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="trending"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="trending" className="cursor-pointer">
                Trending Product
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="active" className="cursor-pointer">
                Active (Visible to customers)
              </Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  )
}

