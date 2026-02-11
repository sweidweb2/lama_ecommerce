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
import { EditBrandDialog } from "@/components/admin/brand/edit_form"
import { DeleteBrandDialog } from "@/components/admin/brand/delete_dialog"
import { CreateBrandDialog } from "@/components/admin/brand/create_form"
import type { Brand } from "@/types/product"

interface AdminBrandsClientProps {
  brands: Brand[]
  createBrandAction: (formData: FormData) => void | Promise<void>
  updateBrandAction: (formData: FormData) => void | Promise<void>
  deleteBrandAction: (formData: FormData) => void | Promise<void>
}

export default function AdminBrandsClient({
  brands,
  createBrandAction,
  updateBrandAction,
  deleteBrandAction,
}: AdminBrandsClientProps) {
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
            {brands.map((brand) => {
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
    </div>
  )
}

