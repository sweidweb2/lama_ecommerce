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
  deleteBrandAction: (
    formData: FormData,
  ) => Promise<{ success: true } | { success: false; error: string }>
}

const ROWS_PER_PAGE = 10

export default function AdminBrandsClient({
  brands,
  createBrandAction,
  updateBrandAction,
  deleteBrandAction,
}: AdminBrandsClientProps) {
  const [nameFilter, setNameFilter] = useState("")
  const [page, setPage] = useState(1)

  const filteredBrands = useMemo(() => {
    const query = nameFilter.trim().toLowerCase()

    return brands.filter((brand) => {
      if (!query) return true

      const name = (brand.name ?? "").toLowerCase()
      const slug = (brand.slug ?? "").toLowerCase()

      return name.includes(query) || slug.includes(query)
    })
  }, [brands, nameFilter])

  const pageCount = Math.max(1, Math.ceil(filteredBrands.length / ROWS_PER_PAGE))
  const currentPage = Math.min(page, pageCount)

  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE
    return filteredBrands.slice(start, start + ROWS_PER_PAGE)
  }, [filteredBrands, currentPage])

  const handleChangePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pageCount) return
    setPage(nextPage)
  }

  const pageFrom =
    filteredBrands.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1
  const pageTo = Math.min(currentPage * ROWS_PER_PAGE, filteredBrands.length)

  return (
    <div className="space-y-6">
      <BrandsHeader createBrandAction={createBrandAction} />

      <BrandsFilters
        nameFilter={nameFilter}
        onNameFilterChange={(value) => {
          setNameFilter(value)
          setPage(1)
        }}
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
