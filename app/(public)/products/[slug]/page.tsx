import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/repositories/product.repository'
import { getProductVariantsByProductIdService } from '@/services/product_variant.service'
import { getRelatedProductsService } from '@/services/product.service'
import { getProductReviewsService } from '@/services/review.service'
import { ProductBreadcrumbs } from '@/components/(public)/products/ProductBreadcrumbs'
import { ProductMediaGallery } from '@/components/(public)/products/product_details/ProductMediaGallery'
import { ProductCoreInfo } from '@/components/(public)/products/product_details/ProductCoreInfo'
import { ProductPricing } from '@/components/(public)/products/product_details/ProductPricing'
import { ProductCustomization } from '@/components/(public)/products/product_details/ProductCustomization'
import { ProductVariantProvider } from '@/components/(public)/products/product_details/ProductVariantProvider'
import { ProductReviews } from '@/components/(public)/products/product_details/ProductReviews'
import { ProductComments } from '@/components/(public)/products/product_details/ProductComments'
import { ProductRelated } from '@/components/(public)/products/product_details/ProductRelated'
import { ProductMetadata } from '@/components/(public)/products/product_details/ProductMetadata'
import { ProductViewTracker } from '@/components/(public)/products/product_details/ProductViewTracker'
import type { ProductVariant } from '@/types/product'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

/**
 * Product Details Page
 * 
 * Architecture:
 * - Single source of truth: Database schema (products, product_images, customised_products)
 * - Component-based: Each section is a self-contained, reusable component
 * - Data-driven: All UI reflects actual database structure
 * - Scalable: Easy to extend with new attributes/variants
 * 
 * Component Organization:
 * - ProductMediaGallery: Maps to product_images table
 * - ProductCoreInfo: Maps to products table (name, description, category, brand)
 * - ProductPricing: Maps to products.price and customised_products.price_override
 * - ProductVariantSelector: Maps to customised_products (color, size, material)
 * - ProductAvailability: Maps to customised_products.quantity_stock
 * - ProductActions: Handles cart operations (maps to carts/cart_items)
 * - ProductReviews: Maps to reviews table
 * - ProductRelated: Related products by priority (brand+category, then brand, then category, then rest)
 * - ProductMetadata: SKU, timestamps, etc.
 */
export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { slug } = await params

  // Fetch product by slug from database
  const product = await getProductBySlug(slug)
  
  if (!product) {
    notFound()
  }

  // Extract related data from product relations
  const category = product.category ?? undefined
  const brand = product.brand ?? undefined
  const images = product.images || []
  
  // Fetch real variants from database
  const realVariants = await getProductVariantsByProductIdService(product.id)
  const variants: ProductVariant[] = realVariants.map((variant) => ({
    id: variant.id,
    product_id: variant.product_id,
    color: variant.color,
    size: variant.size,
    material: variant.material,
    quantity_stock: variant.quantity_stock,
    sku_variant: variant.sku_variant,
    price_override: variant.price_override,
    created_at: variant.created_at,
  })))

  // Related products: tiered bounded queries (no full-catalog fetch)
  const relatedProducts = await getRelatedProductsService(
    {
      id: product.id,
      brand_id: product.brand_id,
      category_id: product.category_id,
    },
    12,
  )

  // Fetch reviews for this product
  const reviews = await getProductReviewsService(product.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Track product view (client-side) */}
      <ProductViewTracker productId={product.id} />
      
      {/* Breadcrumbs */}
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ProductBreadcrumbs 
            productName={product.name}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16">
          {/* Left Column: Media Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductMediaGallery 
              productName={product.name}
              images={images}
              isFeatured={product.is_featured}
              isTrending={product.is_trending}
            />
          </div>

          {/* Right Column: Product Information */}
          <ProductVariantProvider>
            <div className="space-y-6">
              {/* Core Information */}
              <ProductCoreInfo
                name={product.name}
                description={product.description}
                category={category}
                brand={brand}
                isFeatured={product.is_featured}
                isTrending={product.is_trending}
              />

              {/* Pricing */}
              <ProductPricing
                basePrice={product.price}
                variants={variants}
              />

              {/* Product Customization (Color, Size, Quantity, Add to Cart) */}
              {variants.length > 0 && (
                <ProductCustomization
                  productId={product.id}
                  variants={variants}
                />
              )}

              {/* Metadata */}
              <ProductMetadata
                sku={product.sku}
                slug={product.slug}
              />
            </div>
          </ProductVariantProvider>
        </div>

        {/* Reviews Section */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
          <ProductReviews 
            productId={product.id}
            reviews={reviews}
            stats={product.stats || undefined}
          />
        </div>

        {/* Comments Section */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
          <ProductComments productId={product.id} reviews={reviews} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
            <ProductRelated products={relatedProducts} />
          </div>
        )}
      </div>
    </div>
  )
}
