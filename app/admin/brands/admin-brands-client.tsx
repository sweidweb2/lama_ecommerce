'use client'

import { useMemo, useState } from "react"
import type { Brand } from "@/types/product"
import { BrandsHeader } from "@/components/admin/brand/brands-header"
import { BrandsFilters } from "@/components/admin/brand/brands-filters"
import { BrandsTable } from "@/components/admin/brand/brands-table"
import { BrandsPagination } from "@/components/admin/brand/brands-pagination"

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

  const pageFrom =
    filteredBrands.length === 0 ? 0 : (currentPage - 1) * safeRowsPerPage + 1
  const pageTo = Math.min(currentPage * safeRowsPerPage, filteredBrands.length)
  return (
    <div className="space-y-6">
      <BrandsHeader createBrandAction={createBrandAction} />

      <BrandsFilters
        nameFilter={nameFilter}
        rowsPerPage={safeRowsPerPage}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        onNameFilterChange={(value) => {
          setNameFilter(value)
          setPage(1)
        }}
        onRowsPerPageChange={(value) => handleChangeRowsPerPage(String(value))}
      />

      <BrandsTable
        brands={paginatedBrands}
        updateBrandAction={updateBrandAction}
        deleteBrandAction={deleteBrandAction}
      />

      <BrandsPagination
        currentPage={currentPage}
        pageCount={pageCount}
        totalItems={filteredBrands.length}
        pageFrom={pageFrom}
        pageTo={pageTo}
        onPageChange={handleChangePage}
      />
    </div>
  )
}

