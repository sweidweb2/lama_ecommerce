'use client'

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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

      <div className="space-y-1 w-full sm:w-56">
        <label className="text-xs font-medium text-muted-foreground">
          Filter by parent
        </label>
        <Select
          value={parentFilter}
          onValueChange={(value) => onParentFilterChange(value as typeof parentFilter)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All parents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All parents</SelectItem>
            <SelectItem value="root">No parent (root)</SelectItem>
            {parentOptions.map((parent) => (
              <SelectItem key={parent.id} value={parent.id}>
                {parent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
