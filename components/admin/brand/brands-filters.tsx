'use client'

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BrandsFiltersProps {
  nameFilter: string
  rowsPerPage: number
  rowsPerPageOptions: number[]
  onNameFilterChange: (value: string) => void
  onRowsPerPageChange: (value: number) => void
}

export function BrandsFilters({
  nameFilter,
  rowsPerPage,
  rowsPerPageOptions,
  onNameFilterChange,
  onRowsPerPageChange,
}: BrandsFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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

      <div className="flex items-center justify-between sm:justify-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Rows per page
          </label>
          <Select
            value={String(rowsPerPage)}
            onValueChange={(value) => onRowsPerPageChange(Number(value))}
          >
            <SelectTrigger className="h-9 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rowsPerPageOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

