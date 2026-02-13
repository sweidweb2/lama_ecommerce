import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditProductDialog, type AdminProduct } from '@/components/admin/product/edit_form'
import { DeleteProductDialog } from '@/components/admin/product/delete_dialog'
import { VariantsTable, type ProductVariant } from '@/components/admin/product/VariantsTable'
import { CreateVariantForm } from '@/components/admin/product/CreateVariantForm'
import { AddImageForm } from '@/components/admin/product/AddImageForm'
import { ChangePrimaryImageDialog } from '@/components/admin/product/ChangePrimaryImageDialog'
import { ProductImageGallery } from '@/components/admin/product/ProductImageGallery'
import { ProductDetailsBreadcrumbs } from '@/components/admin/product/ProductDetailsBreadcrumbs'
import { StatCard } from '@/components/admin/stat-card'
import { formatPrice } from '@/lib/utils'
import { Eye, ShoppingCart, ShoppingBag } from 'lucide-react'
import { getAdminProductByIdService } from '@/services/product.service'
import { getBrandsService } from '@/services/brand.service'
import { getCategoriesService } from '@/services/categories.service'
import type { ProductWithRelations } from '@/types/product'

interface ProductDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

// Convert ProductWithRelations to AdminProduct format
function toAdminProduct(product: ProductWithRelations): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    slug: product.slug,
    brand_id: product.brand_id,
    category_id: product.category_id,
    sku: product.sku,
    price: product.price,
    is_featured: product.is_featured,
    is_trending: product.is_trending,
    is_active: product.is_active,
    image: product.images?.[0]?.url_image,
  }
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { id } = await params

  // Load product + supporting data (brands & categories) from the database.
  const [product, brands, categories] = await Promise.all([
    getAdminProductByIdService(id),
    getBrandsService(),
    getCategoriesService(),
  ])

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Product Details</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-1">
          This product does not exist yet, but the admin detail layout is ready.
        </p>
      </div>
    )
  }

  const adminProduct = toAdminProduct(product)
  const productImages = product.images || []
  const category = product.category
  const brand = product.brand

  // Dummy statistics data (in a real app, this would come from the database)
  const productStats = {
    views: Math.floor(Math.random() * 5000) + 1000, // Random between 1000-6000
    orders: Math.floor(Math.random() * 500) + 50, // Random between 50-550
    addedToCart: Math.floor(Math.random() * 800) + 100, // Random between 100-900
  }

  // Generate dummy variants for the product
  const dummyVariants: ProductVariant[] = [
    {
      id: 'variant-1',
      product_id: product.id,
      color: 'Black',
      size: 'M',
      material: 'Cotton',
      quantity_stock: 50,
      sku_variant: `${product.sku}-BLK-M`,
      price_override: null,
      created_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'variant-2',
      product_id: product.id,
      color: 'White',
      size: 'L',
      material: 'Cotton',
      quantity_stock: 30,
      sku_variant: `${product.sku}-WHT-L`,
      price_override: 109.99,
      created_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'variant-3',
      product_id: product.id,
      color: 'Red',
      size: 'S',
      material: 'Polyester',
      quantity_stock: 0,
      sku_variant: `${product.sku}-RED-S`,
      price_override: null,
      created_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'variant-4',
      product_id: product.id,
      color: 'Blue',
      size: 'XL',
      material: 'Cotton',
      quantity_stock: 25,
      sku_variant: `${product.sku}-BLU-XL`,
      price_override: 119.99,
      created_at: new Date().toISOString(),
      deleted_at: null,
    },
  ]

  return (
    <div>
      {/* Breadcrumbs */}
      <ProductDetailsBreadcrumbs productName={product.name} />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Product Details</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              View and manage product information
            </p>
          </div>
          <div className="flex gap-2">
            <EditProductDialog
              product={adminProduct}
              showText
              brands={brands}
              categories={categories}
            />
            <DeleteProductDialog product={adminProduct} showText />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Product Views"
                value={productStats.views.toLocaleString()}
                description="Total views"
                icon={Eye}
              />
              <StatCard
                title="Product Orders"
                value={productStats.orders.toLocaleString()}
                description="Total orders"
                icon={ShoppingCart}
              />
              <StatCard
                title="Added to Cart"
                value={productStats.addedToCart.toLocaleString()}
                description="Total cart additions"
                icon={ShoppingBag}
              />
            </div>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Left column */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Product Name
                      </label>
                      <p className="text-lg font-semibold mt-1 truncate">{product.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">SKU</label>
                      <p className="text-sm font-medium mt-1 truncate">{product.sku || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Price</label>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    
                  </div>

                  {/* Right column */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Description
                      </label>
                      <p className="text-sm mt-1 text-foreground line-clamp-3">
                        {product.description || 'No description available'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Slug</label>
                      <p className="text-sm font-medium mt-1 truncate">{product.slug || '—'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Create Customized Product */}
            <Card>
              <CardHeader>
                <CardTitle>Create Customized Product</CardTitle>
              </CardHeader>
              <CardContent>
                <CreateVariantForm productId={product.id} productPrice={product.price} />
              </CardContent>
            </Card>

            {/* Customized Products (Variants) */}
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
              </CardHeader>
              <CardContent>
                <VariantsTable variants={dummyVariants} productPrice={product.price} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Product Image */}
            <Card>
              <CardHeader>
                <CardTitle>Product Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProductImageGallery productId={product.id} productName={product.name} images={productImages} />
                <AddImageForm productId={product.id} />
                <ChangePrimaryImageDialog productId={product.id} images={productImages} />
              </CardContent>
            </Card>

            {/* Status & Flags */}
            <Card>
              <CardHeader>
                <CardTitle>Status & Flags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {product.is_featured && <Badge variant="outline">Featured</Badge>}
                    {product.is_trending && <Badge variant="outline">Trending</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category & Brand */}
            <Card>
              <CardHeader>
                <CardTitle>Category & Brand</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-sm font-medium mt-1 truncate">
                    {category?.name || 'Uncategorized'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Brand</label>
                  <p className="text-sm font-medium mt-1 truncate">
                    {brand?.name || 'No brand'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product ID</label>
                  <p className="text-sm font-mono mt-1 truncate break-all">{product.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-sm mt-1">
                    {new Date(product.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <p className="text-sm mt-1">
                    {new Date(product.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
