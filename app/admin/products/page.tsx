import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ProductsTable } from "@/components/admin/product/ProductsTable"
import { ProductStats } from "@/components/admin/product/ProductStats"
import { type AdminProduct } from "@/components/admin/product/edit_form"

// Dummy data
const products: AdminProduct[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    description: "Noise cancelling headphones with premium sound quality.",
    slug: "wireless-headphones",
    brand_id: "brand-1",
    category_id: "cat-1",
    sku: "ELEC-002",
    price: 99.99,
    is_featured: false,
    is_trending: true,
    is_active: true,
    image: "/placeholder-product.jpg",
  },
  {
    id: "2",
    name: "Smart Watch",
    description: "Keep track of your fitness and stay connected.",
    slug: "smart-watch",
    brand_id: "brand-1",
    category_id: "cat-1",
    sku: "ELEC-003",
    price: 249.99,
    is_featured: false,
    is_trending: false,
    is_active: true,
    image: "/placeholder-product.jpg",
  },
  {
    id: "3",
    name: "Laptop Stand",
    description: "Ergonomic laptop stand for better posture.",
    slug: "laptop-stand",
    brand_id: null,
    category_id: "cat-1",
    sku: "ELEC-006",
    price: 49.99,
    is_featured: false,
    is_trending: false,
    is_active: true,
    image: "/placeholder-product.jpg",
  },
  {
    id: "4",
    name: "Mechanical Keyboard",
    description: "Clicky mechanical keyboard for typing enthusiasts.",
    slug: "mechanical-keyboard",
    brand_id: "brand-1",
    category_id: "cat-1",
    sku: "ELEC-005",
    price: 129.99,
    is_featured: true,
    is_trending: false,
    is_active: true,
    image: "/placeholder-product.jpg",
  },
  {
    id: "5",
    name: "USB-C Cable",
    description: "High-speed USB-C charging cable.",
    slug: "usb-c-cable",
    brand_id: null,
    category_id: "cat-1",
    sku: "ELEC-007",
    price: 19.99,
    is_featured: false,
    is_trending: true,
    is_active: true,
    image: "/placeholder-product.jpg",
  },
]

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your product catalog
          </p>
        </div>
        <Link href="/admin/products/create">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Product
          </Button>
        </Link>
      </div>

      <ProductStats products={products} />

      <ProductsTable products={products} />
    </div>
  )
}
