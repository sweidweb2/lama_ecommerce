'use client'

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { DUMMY_CATEGORIES, DUMMY_PRODUCTS } from "@/lib/constants/dummy-data"
import {
  CreateCategoryDialog,
  type AdminCategory,
} from "@/components/admin/category/create_form"
import { EditCategoryDialog } from "@/components/admin/category/edit_form"
import { DeleteCategoryDialog } from "@/components/admin/category/delete_dialog"

const initialCategories: AdminCategory[] = DUMMY_CATEGORIES

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>(initialCategories)

  const handleCategoryCreated = (category: AdminCategory) => {
    setCategories((prev) => [category, ...prev])
  }

  const handleCategoryUpdated = (updated: AdminCategory) => {
    setCategories((prev) =>
      prev.map((category) => (category.id === updated.id ? updated : category)),
    )
  }

  const handleCategoryDeleted = (categoryId: string) => {
    setCategories((prev) => prev.filter((category) => category.id !== categoryId))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Organize your catalog into categories (dummy data for now).
          </p>
        </div>
        <CreateCategoryDialog
          parentOptions={categories}
          onCreated={handleCategoryCreated}
        />
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="hidden sm:table-cell">Parent</TableHead>
              <TableHead className="hidden sm:table-cell">Products</TableHead>
              <TableHead className="hidden sm:table-cell">Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => {
              const productsCount = DUMMY_PRODUCTS.filter(
                (p) => p.category_id === category.id,
              ).length

              const parent =
                category.parent_id &&
                categories.find((c) => c.id === category.parent_id)

              const isActive = category.is_active && category.deleted_at == null

              return (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                      {category.slug ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {parent ? (
                      <span className="text-sm text-muted-foreground">
                        {parent.name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Root</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={productsCount > 0 ? "default" : "secondary"}>
                      {productsCount} product{productsCount === 1 ? "" : "s"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {new Date(category.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                      <EditCategoryDialog
                        category={category}
                        allCategories={categories}
                        onUpdated={handleCategoryUpdated}
                      />
                      <DeleteCategoryDialog
                        category={{ id: category.id, name: category.name }}
                        onDelete={handleCategoryDeleted}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}

