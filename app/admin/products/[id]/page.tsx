import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { EditProductDialog, type AdminProduct } from '@/components/admin/product/edit_form'
import { DeleteProductDialog } from '@/components/admin/product/delete_dialog'
import { VariantsTable, type ProductVariant } from '@/components/admin/product/VariantsTable'
import { CreateVariantForm } from '@/components/admin/product/CreateVariantForm'
import { ProductDetailsBreadcrumbs } from '@/components/admin/product/ProductDetailsBreadcrumbs'
import { DUMMY_PRODUCTS, DUMMY_CATEGORIES, DUMMY_BRANDS } from '@/lib/constants/dummy-data'
import { formatPrice } from '@/lib/utils'

interface ProductDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

// Convert ProductWithRelations to AdminProduct format
function toAdminProduct(product: typeof DUMMY_PRODUCTS[0]): AdminProduct {
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

  // Find product in dummy data (for now, we'll search by ID or use first product as fallback)
  // In a real app, you'd fetch from the database
  let product = DUMMY_PRODUCTS.find((p) => p.id === id)
  
  // If not found, use the first product as a fallback for demo purposes
  if (!product) {
    product = DUMMY_PRODUCTS[0]
  }

  const adminProduct = toAdminProduct(product)
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0]
  const imageUrl = primaryImage?.url_image || '/placeholder-product.webp'
  const category = DUMMY_CATEGORIES.find((c) => c.id === product.category_id)
  const brand = DUMMY_BRANDS.find((b) => b.id === product.brand_id)

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
            <EditProductDialog product={adminProduct} showText />
            <DeleteProductDialog product={adminProduct} showText />
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                <p className="text-lg font-semibold mt-1">{product.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm mt-1 text-foreground">
                  {product.description || 'No description available'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU</label>
                  <p className="text-sm font-medium mt-1">{product.sku || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Slug</label>
                  <p className="text-sm font-medium mt-1">{product.slug || '—'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Price</label>
                <p className="text-2xl font-bold text-primary mt-1">{formatPrice(product.price)}</p>
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
            <CardContent>
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted border">
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status & Flags */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {product.is_active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {product.is_featured && (
                    <Badge variant="outline">Featured</Badge>
                  )}
                  {product.is_trending && (
                    <Badge variant="outline">Trending</Badge>
                  )}
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
                <p className="text-sm font-medium mt-1">
                  {category?.name || 'Uncategorized'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Brand</label>
                <p className="text-sm font-medium mt-1">
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
                <p className="text-sm font-mono mt-1">{product.id}</p>
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
