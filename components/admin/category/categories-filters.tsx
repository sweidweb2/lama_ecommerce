'use client'

import { useMemo } from "react"
import {
  AdminFilterBar,
  type AdminFilterField,
} from "@/components/admin/shared/admin-filter-bar"
import type { Category as AdminCategory } from "@/types/product"

interface CategoriesFiltersProps {
  nameFilter: string
  parentFilter: string | "all"
  parentOptions: AdminCategory[]
  onNameFilterChange: (value: string) => void
  onParentFilterChange: (value: string | "all") => void
}

export function CategoriesFilters({
  nameFilter,
  parentFilter,
  parentOptions,
  onNameFilterChange,
  onParentFilterChange,
}: CategoriesFiltersProps) {
  const fields = useMemo<AdminFilterField[]>(
    () => [
      {
        type: "text",
        key: "name",
        label: "Search by name or slug",
        placeholder: "Type to filter…",
        className: "w-full sm:w-64",
      },
      {
        type: "select",
        key: "parent",
        label: "Filter by parent",
        allValue: "all",
        className: "w-full sm:w-56",
        options: [
          { value: "root", label: "No parent (root)" },
          ...parentOptions.map((parent) => ({
            value: parent.id,
            label: parent.name,
          })),
        ],
      },
    ],
    [parentOptions],
  )

  const values = useMemo(
    () => ({
      name: nameFilter,
      parent: parentFilter === "all" ? "" : parentFilter,
    }),
    [nameFilter, parentFilter],
  )

  const handleChange = (key: string, value: string) => {
    if (key === "name") {
      onNameFilterChange(value)
      return
    }
    onParentFilterChange(value || "all")
  }

  return (
    <AdminFilterBar
      fields={fields}
      values={values}
      onChange={handleChange}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    />
  )
}
