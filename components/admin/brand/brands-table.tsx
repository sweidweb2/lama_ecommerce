'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { EditBrandDialog } from "@/components/admin/brand/forms/edit_form"
import { DeleteBrandDialog } from "@/components/admin/brand/forms/delete_dialog"
import type { Brand } from "@/types/product"

interface BrandsTableProps {
  brands: Brand[]
  updateBrandAction: (formData: FormData) => void | Promise<void>
  deleteBrandAction: (
    formData: FormData,
  ) => Promise<{ success: true } | { success: false; error: string }>
}

export function BrandsTable({
  brands,
  updateBrandAction,
  deleteBrandAction,
}: BrandsTableProps) {
  return (
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
          {brands.map((brand) => (
            <TableRow key={brand.id}>
              <TableCell className="font-medium">
                {brand.name || "no name available"}
              </TableCell>
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
                  <span className="text-xs text-muted-foreground">no logo</span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                {brand.created_at
                  ? new Date(brand.created_at)
                      .toLocaleString("en-GB", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                        timeZone: "UTC",
                      })
                      .replace(",", "")
                  : "no date available"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <EditBrandDialog brand={brand} action={updateBrandAction} />
                  <DeleteBrandDialog brand={brand} action={deleteBrandAction} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableWrapper>
  )
}

