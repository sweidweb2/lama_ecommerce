"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "@/components/ui/link";
import type { Brand, Category } from "@/types/product";
import {
  createProductWithVariantsSchema,
  type CreateProductWithVariantsSchemaInput,
} from "@/lib/validators/product/create_with_variants";
import type { CreateProductActionResult } from "@/actions/product";
import {
  ProductVariantsRepeater,
  createEmptyVariantDraft,
  type VariantDraftRow,
  type VariantFieldErrors,
} from "@/components/admin/product/ProductVariantsRepeater";
import {
  MAX_SERVER_ACTION_UPLOAD_BYTES,
  MAX_SERVER_ACTION_UPLOAD_LABEL,
} from "@/lib/constants/uploads";

const NONE_VALUE = "__none__";

interface CreateProductFormProps {
  action: (formData: FormData) => Promise<CreateProductActionResult>;
  brands: Brand[];
  categories: Category[];
}

type ProductFieldKey = Exclude<
  keyof CreateProductWithVariantsSchemaInput,
  "variants"
>;

export function CreateProductForm({
  action,
  brands,
  categories,
}: CreateProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [brandId, setBrandId] = useState(NONE_VALUE);
  const [categoryId, setCategoryId] = useState(NONE_VALUE);
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<VariantDraftRow[]>([
    createEmptyVariantDraft(),
  ]);
  const [errors, setErrors] = useState<Partial<Record<ProductFieldKey, string>>>(
    {},
  );
  const [variantErrors, setVariantErrors] = useState<
    Record<number, VariantFieldErrors>
  >({});
  const [variantsFormError, setVariantsFormError] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedSlug = slug.trim();
    const trimmedSku = sku.trim();

    const candidate: CreateProductWithVariantsSchemaInput = {
      name: trimmedName,
      description: trimmedDescription ? trimmedDescription : null,
      slug: trimmedSlug,
      brand_id: brandId === NONE_VALUE ? null : brandId,
      category_id: categoryId === NONE_VALUE ? null : categoryId,
      sku: trimmedSku ? trimmedSku.toUpperCase() : null,
      price: price ? Number(price) : NaN,
      is_featured: isFeatured,
      is_trending: isTrending,
      is_active: isActive,
      variants: variants.map((row) => ({
        color: row.color.trim(),
        size: row.size.trim(),
        material: row.material.trim(),
        quantity_stock: row.quantity_stock ? Number(row.quantity_stock) : NaN,
        sku_variant: row.sku_variant.trim() || null,
        price_override: row.price_override
          ? Number(row.price_override)
          : null,
      })),
    };

    const parsed = createProductWithVariantsSchema.safeParse(candidate);

    if (!parsed.success) {
      const fieldErrors: Partial<Record<ProductFieldKey, string>> = {};
      const nextVariantErrors: Record<number, VariantFieldErrors> = {};
      let nextVariantsFormError: string | undefined;

      for (const issue of parsed.error.issues) {
        const [head, index, field] = issue.path;
        if (head === "variants") {
          if (typeof index === "number" && typeof field === "string") {
            const row = nextVariantErrors[index] ?? {};
            if (!row[field as keyof VariantFieldErrors]) {
              row[field as keyof VariantFieldErrors] = issue.message;
              nextVariantErrors[index] = row;
            }
          } else if (!nextVariantsFormError) {
            nextVariantsFormError = issue.message;
          }
          continue;
        }

        const pathKey = head as ProductFieldKey;
        if (pathKey && !fieldErrors[pathKey]) {
          fieldErrors[pathKey] = issue.message;
        }
      }

      setErrors(fieldErrors);
      setVariantErrors(nextVariantErrors);
      setVariantsFormError(nextVariantsFormError);
      toast.error("Please fix the highlighted errors and try again.");
      return;
    }

    setErrors({});
    setVariantErrors({});
    setVariantsFormError(undefined);

    const form = e.currentTarget;
    const imageInput = form.elements.namedItem("images");
    if (imageInput instanceof HTMLInputElement && imageInput.files?.[0]) {
      const file = imageInput.files[0];
      if (file.size > MAX_SERVER_ACTION_UPLOAD_BYTES) {
        toast.error(
          `Image must be ${MAX_SERVER_ACTION_UPLOAD_LABEL} or smaller`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData(form);

      formData.set("name", parsed.data.name);
      formData.set("description", parsed.data.description ?? "");
      formData.set("slug", parsed.data.slug);
      formData.set("brand_id", parsed.data.brand_id ?? "");
      formData.set("category_id", parsed.data.category_id ?? "");
      formData.set("sku", parsed.data.sku ?? "");
      formData.set("price", parsed.data.price.toString());
      formData.set("is_featured", parsed.data.is_featured ? "true" : "false");
      formData.set("is_trending", parsed.data.is_trending ? "true" : "false");
      formData.set("is_active", parsed.data.is_active ? "true" : "false");
      formData.set("variants", JSON.stringify(parsed.data.variants));

      const result = await action(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (result.variantCreateFailed || result.imageUploadFailed) {
        const parts: string[] = [];
        if (result.variantCreateFailed) {
          parts.push(
            result.variantError ??
              `Created ${result.variantsCreated ?? 0} variant(s); remaining failed.`,
          );
        }
        if (result.imageUploadFailed) {
          parts.push(result.imageError ?? "Image upload failed.");
        }
        toast.warning("Product created with partial issues", {
          description: parts.join(" "),
        });
        router.push(`/admin/products/${result.encryptedId}`);
        return;
      }

      toast.success("Product and variants created successfully!");
      router.push(`/admin/products/${result.encryptedId}`);

      setName("");
      setDescription("");
      setSlug("");
      setBrandId(NONE_VALUE);
      setCategoryId(NONE_VALUE);
      setSku("");
      setPrice("");
      setIsFeatured(false);
      setIsTrending(false);
      setIsActive(true);
      setVariants([createEmptyVariantDraft()]);
    } catch (error) {
      toast.error("Failed to create product");
      console.error("Error creating product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const productPriceNumber = price ? Number(price) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Create Product</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Add a new product and its variants to your catalog
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        encType="multipart/form-data"
      >
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
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug <span className="text-destructive">*</span>
            </Label>
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
              required
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Select
                value={brandId}
                onValueChange={setBrandId}
                disabled={isSubmitting}
              >
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
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={isSubmitting}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.is_active
                        ? category.name
                        : `${category.name} (inactive)`}
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
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Optional. Max {MAX_SERVER_ACTION_UPLOAD_LABEL}. You can add more
              images later from the product details page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                value={sku}
                onChange={(e) =>
                  setSku(e.target.value.toUpperCase().slice(0, 32))
                }
                placeholder="PROD-001"
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Active (Visible to customers)
              </Label>
            </div>
          </div>
        </div>

        <ProductVariantsRepeater
          variants={variants}
          errorsByIndex={variantErrors}
          formError={variantsFormError}
          productPrice={
            Number.isFinite(productPriceNumber) ? productPriceNumber : 0
          }
          disabled={isSubmitting}
          onChange={setVariants}
        />

        <div className="flex justify-end gap-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" loading={isSubmitting}>
            Create Product
          </Button>
        </div>
      </form>
    </div>
  );
}
