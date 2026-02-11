'use client'

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
import type { Category } from "@/types/product"
import { EditCategoryDialog } from "@/components/admin/category/forms/edit_form"
import { DeleteCategoryDialog } from "@/components/admin/category/forms/delete_dialog"

interface CategoriesTableProps {
  categories: Category[]
  allCategories: Category[]
  updateCategoryAction: (formData: FormData) => void | Promise<void>
  deleteCategoryAction: (formData: FormData) => void | Promise<void>
}

export function CategoriesTable({
  categories,
  allCategories,
  updateCategoryAction,
  deleteCategoryAction,
}: CategoriesTableProps) {
  return (
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
            const productsCount = 0 // TODO: wire real product counts per category

            const parent =
              category.parent_id &&
              allCategories.find((c) => c.id === category.parent_id)

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
                    {productsCount} product{productsCount > 1 ? "s" : ""}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                  {new Date(category.created_at).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                    <EditCategoryDialog
                      category={category}
                      allCategories={allCategories}
                      action={updateCategoryAction}
                    />
                    <DeleteCategoryDialog
                      category={category}
                      action={deleteCategoryAction}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableWrapper>
  )
}

