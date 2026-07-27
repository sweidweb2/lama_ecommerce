'use client'

import { Input } from "@/components/ui/input"

interface BrandsFiltersProps {
  nameFilter: string
  onNameFilterChange: (value: string) => void
}

export function BrandsFilters({
  nameFilter,
  onNameFilterChange,
}: BrandsFiltersProps) {
  return (
    <div className="space-y-1 w-full sm:w-64">
      <label className="text-xs font-medium text-muted-foreground">
        Search by name or slug
      </label>
      <Input
        value={nameFilter}
        onChange={(e) => onNameFilterChange(e.target.value)}
        placeholder="Type to filter…"
        className="h-9"
      />
    </div>
  )
}
