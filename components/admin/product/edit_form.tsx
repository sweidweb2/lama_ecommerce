"use client";

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
import { Edit } from "lucide-react";
import type { Brand, Category } from "@/types/product";
import { z } from "zod";
import { updateProductAction } from "@/actions/product";
import { createProductSchema } from "@/lib/validators/product/create";
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";

export type AdminProduct = {
  id: string;
  name: string;
  description?: string | null;
  slug: string;
  brand_id?: string | null;
  category_id?: string | null;
  sku?: string | null;
  price: number;
  is_featured?: boolean;
  is_trending?: boolean;
  is_active?: boolean;
  image?: string;
};

type EditValues = {
  name: string;
  description: string;
  slug: string;
  brandId: string;
  categoryId: string;
  sku: string;
  price: string;
  isFeatured: boolean;
  isTrending: boolean;
  isActive: boolean;
};

interface EditProductDialogProps {
  product: AdminProduct;
  showText?: boolean;
  brands: Brand[];
  categories: Category[];
}

const NONE_VALUE = "__none__";

export function EditProductDialog({
  product,
  showText = false,
  brands = [],
  categories = [],
}: EditProductDialogProps) {
  const router = useRouter();

  return (
    <AdminFormDialog<EditValues>
      mode="edit"
      title="Edit Product"
      triggerLabel={`Edit ${product.name}`}
      contentClassName="max-w-2xl max-h-[90vh] overflow-y-auto"
      initialValues={{
        name: product.name,
        description: product.description || "",
        slug: product.slug,
        brandId: product.brand_id || NONE_VALUE,
        categoryId: product.category_id || NONE_VALUE,
        sku: product.sku || "",
        price: product.price.toString(),
        isFeatured: product.is_featured ?? false,
        isTrending: product.is_trending ?? false,
        isActive: product.is_active ?? true,
      }}
      submitLabel="Save changes"
      toastMessages={{
        success: "Product updated",
        errorTitle: "Failed to update product",
      }}
      onSuccess={() => router.refresh()}
      trigger={({ open }) => (
        <Button
          variant={showText ? "outline" : "ghost"}
          size={showText ? "default" : "icon"}
          onClick={open}
          aria-label={`Edit ${product.name}`}
        >
          <Edit className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
          {showText && "Edit"}
        </Button>
      )}
      onSubmit={async (values) => {
        const trimmedName = values.name.trim();
        const trimmedDescription = values.description.trim();
        const trimmedSlug = values.slug.trim();
        const trimmedSku = values.sku.trim();

        const candidate: z.input<typeof createProductSchema> = {
          name: trimmedName,
          description: trimmedDescription ? trimmedDescription : null,
          slug: trimmedSlug
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "")
            .slice(0, 40),
          brand_id: values.brandId === NONE_VALUE ? null : values.brandId,
          category_id:
            values.categoryId === NONE_VALUE ? null : values.categoryId,
          sku: trimmedSku ? trimmedSku.toUpperCase().slice(0, 32) : null,
          price: values.price ? Number(values.price) : NaN,
          is_featured: values.isFeatured,
          is_trending: values.isTrending,
          is_active: values.isActive,
        };

        const parsed = createProductSchema.safeParse(candidate);

        if (!parsed.success) {
          return {
            success: false,
            error:
              parsed.error.issues[0]?.message ?? "Please fix the form errors",
          };
        }

        const formData = new FormData();
        formData.set("id", product.id);
        formData.set("name", parsed.data.name);
        formData.set("description", parsed.data.description ?? "");
        formData.set("slug", parsed.data.slug);
        formData.set("brand_id", parsed.data.brand_id ?? "");
        formData.set("category_id", parsed.data.category_id ?? "");
        formData.set("sku", parsed.data.sku ?? "");
        formData.set("price", parsed.data.price.toString());
        formData.set(
          "is_featured",
          parsed.data.is_featured ? "true" : "false",
        );
        formData.set(
          "is_trending",
          parsed.data.is_trending ? "true" : "false",
        );
        formData.set("is_active", parsed.data.is_active ? "true" : "false");

        const result = await updateProductAction(formData);
        if (!result.success) {
          return { success: false, error: result.error };
        }

        return { success: true };
      }}
    >
      {({ values, setValues }) => (
        <>
          <div className="space-y-2">
            <Label htmlFor={`product-name-${product.id}`}>
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`product-name-${product.id}`}
              value={values.name}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`product-slug-${product.id}`}>
              Slug <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`product-slug-${product.id}`}
              value={values.slug}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                    .slice(0, 40),
                }))
              }
              placeholder="product-slug"
              maxLength={40}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`product-description-${product.id}`}>
              Description
            </Label>
            <Textarea
              id={`product-description-${product.id}`}
              value={values.description}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter product description"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`product-brand-${product.id}`}>Brand</Label>
              <Select
                value={values.brandId}
                onValueChange={(value) =>
                  setValues((prev) => ({ ...prev, brandId: value }))
                }
              >
                <SelectTrigger
                  id={`product-brand-${product.id}`}
                  className="w-full"
                >
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
              <Select
                value={values.categoryId}
                onValueChange={(value) =>
                  setValues((prev) => ({ ...prev, categoryId: value }))
                }
              >
                <SelectTrigger
                  id={`product-category-${product.id}`}
                  className="w-full"
                >
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`product-sku-${product.id}`}>SKU</Label>
              <Input
                id={`product-sku-${product.id}`}
                value={values.sku}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    sku: e.target.value.toUpperCase().slice(0, 32),
                  }))
                }
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
                value={values.price}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, price: e.target.value }))
                }
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
                checked={values.isFeatured}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    isFeatured: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label
                htmlFor={`product-featured-${product.id}`}
                className="cursor-pointer"
              >
                Featured Product
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`product-trending-${product.id}`}
                checked={values.isTrending}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    isTrending: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label
                htmlFor={`product-trending-${product.id}`}
                className="cursor-pointer"
              >
                Trending Product
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`product-active-${product.id}`}
                checked={values.isActive}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label
                htmlFor={`product-active-${product.id}`}
                className="cursor-pointer"
              >
                Active (Visible to customers)
              </Label>
            </div>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
