import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs"

interface ProductDetailsBreadcrumbsProps {
  productName: string
}

export function ProductDetailsBreadcrumbs({ productName }: ProductDetailsBreadcrumbsProps) {
  return (
    <div className="pb-2">
      <AdminBreadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: productName },
        ]}
      />
    </div>
  )
}
