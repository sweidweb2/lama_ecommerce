'use client'

import { useState } from "react"
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
import { DUMMY_BRANDS, DUMMY_PRODUCTS } from "@/lib/constants/dummy-data"
import { CreateBrandDialog, type AdminBrand } from "@/components/admin/brand/create_form"
import { EditBrandDialog } from "@/components/admin/brand/edit_form"
import { DeleteBrandDialog } from "@/components/admin/brand/delete_dialog"

const initialBrands: AdminBrand[] = DUMMY_BRANDS

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<AdminBrand[]>(initialBrands)

  const handleBrandCreated = (brand: AdminBrand) => {
    setBrands((prev) => [brand, ...prev])
  }

  const handleBrandUpdated = (updatedBrand: AdminBrand) => {
    setBrands((prev) =>
      prev.map((brand) => (brand.id === updatedBrand.id ? updatedBrand : brand)),
    )
  }

  const handleBrandDeleted = (brandId: string) => {
    setBrands((prev) => prev.filter((brand) => brand.id !== brandId))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Brands</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage the brands used across your product catalog (dummy data for now).
          </p>
        </div>
        <CreateBrandDialog onCreated={handleBrandCreated} />
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="hidden sm:table-cell">Products</TableHead>
              <TableHead className="hidden sm:table-cell">Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => {
              const productsCount = DUMMY_PRODUCTS.filter(
                (p) => p.brand_id === brand.id,
              ).length

              const isActive = brand.deleted_at == null

              return (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                      {brand.slug ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={productsCount > 0 ? "default" : "secondary"}>
                      {productsCount} product{productsCount === 1 ? "" : "s"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {new Date(brand.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : "Deleted"}
                      </Badge>
                      <EditBrandDialog
                        brand={brand}
                        onUpdated={handleBrandUpdated}
                      />
                      <DeleteBrandDialog
                        brand={{ id: brand.id, name: brand.name }}
                        onDelete={handleBrandDeleted}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}

