'use client'

import { CreateBrandDialog } from "@/components/admin/brand/forms/create_form"

interface BrandsHeaderProps {
  createBrandAction: (formData: FormData) => void | Promise<void>
}

export function BrandsHeader({ createBrandAction }: BrandsHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Brands</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage the brands used across your product catalog.
        </p>
      </div>
      <CreateBrandDialog action={createBrandAction} />
    </div>
  )
}

