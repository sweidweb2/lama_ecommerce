import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { Plus, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Dummy data
const products = [
  {
    id: "1",
    name: "Wireless Headphones",
    price: 99.99,
    stock: 45,
    status: "In Stock",
    image: "/placeholder-product.jpg",
  },
  {
    id: "2",
    name: "Smart Watch",
    price: 249.99,
    stock: 12,
    status: "Low Stock",
    image: "/placeholder-product.jpg",
  },
  {
    id: "3",
    name: "Laptop Stand",
    price: 49.99,
    stock: 0,
    status: "Out of Stock",
    image: "/placeholder-product.jpg",
  },
  {
    id: "4",
    name: "Mechanical Keyboard",
    price: 129.99,
    stock: 78,
    status: "In Stock",
    image: "/placeholder-product.jpg",
  },
  {
    id: "5",
    name: "USB-C Cable",
    price: 19.99,
    stock: 200,
    status: "In Stock",
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

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">IMG</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      product.status === "In Stock"
                        ? "default"
                        : product.status === "Low Stock"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}
