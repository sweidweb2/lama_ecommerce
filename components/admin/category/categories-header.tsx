'use client'

import { CreateCategoryDialog } from "@/components/admin/category/create_form"
import type { AdminCategory } from "@/components/admin/category/create_form"

interface CategoriesHeaderProps {
  categories: AdminCategory[]
  createCategoryAction: (formData: FormData) => void | Promise<void>
}

export function CategoriesHeader({
  categories,
  createCategoryAction,
}: CategoriesHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Organize your catalog into categories loaded from your database.
        </p>
      </div>
      <CreateCategoryDialog parentOptions={categories} action={createCategoryAction} />
    </div>
  )
}

