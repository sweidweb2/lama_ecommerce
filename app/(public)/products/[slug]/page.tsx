import { notFound } from 'next/navigation'
import { DUMMY_PRODUCTS, DUMMY_CATEGORIES, DUMMY_BRANDS } from '@/lib/constants/dummy-data'
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
 * - ProductRelated: Related products by category
 * - ProductMetadata: SKU, timestamps, etc.
 */
export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { slug } = await params

  // Find product by slug
  // In production, this would be a Supabase query:
  // const { data: product } = await supabase
  //   .from('products')
  //   .select('*, brand:brands(*), category:categories(*), images:product_images(*), variants:customised_products(*)')
  //   .eq('slug', slug)
  //   .eq('is_active', true)
  //   .single()
  
  const product = DUMMY_PRODUCTS.find((p) => p.slug === slug && p.is_active)
  
  if (!product) {
    notFound()
  }

  // Extract related data
  const category = DUMMY_CATEGORIES.find((c) => c.id === product.category_id)
  const brand = DUMMY_BRANDS.find((b) => b.id === product.brand_id)
  const images = product.images || []
  
  // Generate dummy variants if product doesn't have any
  const variants = product.variants && product.variants.length > 0 
    ? product.variants 
    : [
        // Color: Black, Sizes: S, M, L
        {
          id: `variant-${product.id}-1`,
          product_id: product.id,
          color: 'Black',
          size: 'S',
          material: null,
          quantity_stock: 25,
          sku_variant: `${product.sku}-BLK-S`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        {
          id: `variant-${product.id}-2`,
          product_id: product.id,
          color: 'Black',
          size: 'M',
          material: null,
          quantity_stock: 50,
          sku_variant: `${product.sku}-BLK-M`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        {
          id: `variant-${product.id}-3`,
          product_id: product.id,
          color: 'Black',
          size: 'L',
          material: null,
          quantity_stock: 30,
          sku_variant: `${product.sku}-BLK-L`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        {
          id: `variant-${product.id}-4`,
          product_id: product.id,
          color: 'Black',
          size: 'XL',
          material: null,
          quantity_stock: 15,
          sku_variant: `${product.sku}-BLK-XL`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        // Color: White, Sizes: S, M, L
        {
          id: `variant-${product.id}-5`,
          product_id: product.id,
          color: 'White',
          size: 'S',
          material: null,
          quantity_stock: 20,
          sku_variant: `${product.sku}-WHT-S`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        {
          id: `variant-${product.id}-6`,
          product_id: product.id,
          color: 'White',
          size: 'M',
          material: null,
          quantity_stock: 45,
          sku_variant: `${product.sku}-WHT-M`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        {
          id: `variant-${product.id}-7`,
          product_id: product.id,
          color: 'White',
          size: 'L',
          material: null,
          quantity_stock: 35,
          sku_variant: `${product.sku}-WHT-L`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        {
          id: `variant-${product.id}-8`,
          product_id: product.id,
          color: 'White',
          size: 'XL',
          material: null,
          quantity_stock: 10,
          sku_variant: `${product.sku}-WHT-XL`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        // Color: Red, Sizes: S, M, L
        {
          id: `variant-${product.id}-9`,
          product_id: product.id,
          color: 'Red',
          size: 'S',
          material: null,
          quantity_stock: 18,
          sku_variant: `${product.sku}-RED-S`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        {
          id: `variant-${product.id}-10`,
          product_id: product.id,
          color: 'Red',
          size: 'M',
          material: null,
          quantity_stock: 40,
          sku_variant: `${product.sku}-RED-M`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        {
          id: `variant-${product.id}-11`,
          product_id: product.id,
          color: 'Red',
          size: 'L',
          material: null,
          quantity_stock: 28,
          sku_variant: `${product.sku}-RED-L`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        // Color: Blue, Sizes: M, L, XL
        {
          id: `variant-${product.id}-12`,
          product_id: product.id,
          color: 'Blue',
          size: 'M',
          material: null,
          quantity_stock: 32,
          sku_variant: `${product.sku}-BLU-M`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        {
          id: `variant-${product.id}-13`,
          product_id: product.id,
          color: 'Blue',
          size: 'L',
          material: null,
          quantity_stock: 42,
          sku_variant: `${product.sku}-BLU-L`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        {
          id: `variant-${product.id}-14`,
          product_id: product.id,
          color: 'Blue',
          size: 'XL',
          material: null,
          quantity_stock: 22,
          sku_variant: `${product.sku}-BLU-XL`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        // Color: Gray, Size: M (low stock)
        {
          id: `variant-${product.id}-15`,
          product_id: product.id,
          color: 'Gray',
          size: 'M',
          material: null,
          quantity_stock: 5,
          sku_variant: `${product.sku}-GRY-M`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        // Color: Green, Size: L (out of stock)
        {
          id: `variant-${product.id}-16`,
          product_id: product.id,
          color: 'Green',
          size: 'L',
          material: null,
          quantity_stock: 0,
          sku_variant: `${product.sku}-GRN-L`,
          price_override: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
      ]

  // Get related products (same category, excluding current)
  // If not enough in same category, include products from other categories
  let relatedProducts = DUMMY_PRODUCTS
    .filter((p) => 
      p.id !== product.id && 
      p.category_id === product.category_id && 
      p.is_active
    )
  
  // If not enough products in same category, add from other categories
  if (relatedProducts.length < 12) {
    const additionalProducts = DUMMY_PRODUCTS
      .filter((p) => 
        p.id !== product.id && 
        p.category_id !== product.category_id && 
        p.is_active
      )
      .slice(0, 12 - relatedProducts.length)
    
    relatedProducts = [...relatedProducts, ...additionalProducts]
  }
  
  // Limit to 12 products
  relatedProducts = relatedProducts.slice(0, 12)

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ProductBreadcrumbs 
            categoryName={category?.name}
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
            stats={product.stats}
          />
        </div>

        {/* Comments Section */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
          <ProductComments productId={product.id} />
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
