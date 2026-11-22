'use client'

import { useMemo } from "react"
import {
  AdminFilterBar,
  type AdminFilterField,
} from "@/components/admin/shared/admin-filter-bar"

interface BrandsFiltersProps {
  nameFilter: string
  onNameFilterChange: (value: string) => void
}

const FIELDS: AdminFilterField[] = [
  {
    type: "text",
    key: "name",
    label: "Search by name or slug",
    placeholder: "Type to filter…",
    className: "w-full sm:w-64",
  },
]

export function BrandsFilters({
  nameFilter,
  onNameFilterChange,
}: BrandsFiltersProps) {
  const values = useMemo(() => ({ name: nameFilter }), [nameFilter])

  return (
    <AdminFilterBar
      fields={FIELDS}
      values={values}
      onChange={(_key, value) => onNameFilterChange(value)}
      className="flex items-end"
    />
  )
}
