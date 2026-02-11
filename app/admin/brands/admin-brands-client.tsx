'use client'

import { useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { EditBrandDialog } from "@/components/admin/brand/edit_form"
import { DeleteBrandDialog } from "@/components/admin/brand/delete_dialog"
import { CreateBrandDialog } from "@/components/admin/brand/create_form"
import type { Brand } from "@/types/product"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface AdminBrandsClientProps {
  brands: Brand[]
  createBrandAction: (formData: FormData) => void | Promise<void>
  updateBrandAction: (formData: FormData) => void | Promise<void>
  deleteBrandAction: (formData: FormData) => void | Promise<void>
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50]
const MAX_ROWS_PER_PAGE = 50

export default function AdminBrandsClient({
  brands,
  createBrandAction,
  updateBrandAction,
  deleteBrandAction,
}: AdminBrandsClientProps) {
  const [nameFilter, setNameFilter] = useState("")
  const [rowsPerPage, setRowsPerPage] = useState<number>(ROWS_PER_PAGE_OPTIONS[0])
  const [page, setPage] = useState(1)

  const filteredBrands = useMemo(() => {
    const query = nameFilter.trim().toLowerCase()

    return brands.filter((brand) => {
      if (brand.deleted_at) return false

      if (!query) return true

      const name = (brand.name ?? "").toLowerCase()
      const slug = (brand.slug ?? "").toLowerCase()

      return name.includes(query) || slug.includes(query)
    })
  }, [brands, nameFilter])

  const safeRowsPerPage = Math.min(rowsPerPage, MAX_ROWS_PER_PAGE)
  const pageCount = Math.max(1, Math.ceil(filteredBrands.length / safeRowsPerPage))
  const currentPage = Math.min(page, pageCount)

  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * safeRowsPerPage
    return filteredBrands.slice(start, start + safeRowsPerPage)
  }, [filteredBrands, currentPage, safeRowsPerPage])

  const handleChangeRowsPerPage = (value: string) => {
    const next = Number(value) || ROWS_PER_PAGE_OPTIONS[0]
    const clamped = Math.min(next, MAX_ROWS_PER_PAGE)
    setRowsPerPage(clamped)
    setPage(1)
  }

  const handleChangePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pageCount) return
    setPage(nextPage)
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Brands</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage the brands used across your product catalog.
          </p>
        </div>
        <CreateBrandDialog action={createBrandAction} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1 w-full sm:w-64">
          <label className="text-xs font-medium text-muted-foreground">
            Search by name or slug
          </label>
          <Input
            value={nameFilter}
            onChange={(e) => {
              setNameFilter(e.target.value)
              setPage(1)
            }}
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
              value={String(safeRowsPerPage)}
              onValueChange={handleChangeRowsPerPage}
            >
              <SelectTrigger className="h-9 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROWS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="hidden sm:table-cell">Image</TableHead>
              <TableHead className="hidden sm:table-cell">Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBrands.map((brand) => {
              return (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name || "no name available"}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                      {brand.slug ?? "no slug available"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {brand.logo_image_url ? (
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-muted flex items-center justify-center">
                        <img
                          src={brand.logo_image_url}
                          alt={`${brand.name ?? "Brand"} logo`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        no logo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {brand.created_at
                      ? new Date(brand.created_at).toLocaleString("en-GB", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                          timeZone: "UTC"
                        }).replace(",", "")
                      : "no date available"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <EditBrandDialog brand={brand} action={updateBrandAction} />
                      <DeleteBrandDialog brand={brand} action={deleteBrandAction} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableWrapper>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-medium">
            {filteredBrands.length === 0
              ? 0
              : (currentPage - 1) * safeRowsPerPage + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(currentPage * safeRowsPerPage, filteredBrands.length)}
          </span>{" "}
          of{" "}
          <span className="font-medium">{filteredBrands.length}</span>{" "}
          brands
        </p>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChangePage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page{" "}
            <span className="font-medium">
              {currentPage}
            </span>{" "}
            of{" "}
            <span className="font-medium">
              {pageCount}
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChangePage(currentPage + 1)}
            disabled={currentPage >= pageCount}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

