import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { DUMMY_PRODUCTS } from '@/lib/constants/dummy-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductBreadcrumbs } from '@/components/(public)/products/ProductBreadcrumbs'
import { ProductImageCarousel } from '@/components/(public)/products/product_details/ProductImageCarousel'
import { ProductScrollableGallery } from '@/components/(public)/products/product_details/ProductScrollableGallery'
import { ProductHeader } from '@/components/(public)/products/ProductHeader'
import { ProductRating } from '@/components/(public)/products/product_details/ProductRating'
import { ProductDescription } from '@/components/(public)/products/product_details/ProductDescription'
import { ProductPrice } from '@/components/(public)/products/product_details/ProductPrice'
import { ProductOptions } from '@/components/(public)/products/product_details/ProductOptions'
import { ProductAddToCart } from '@/components/(public)/products/product_details/ProductAddToCart'
import { ProductFavoriteShare } from '@/components/(public)/products/ProductFavoriteShare'
import { ProductTrustInfo } from '@/components/(public)/products/product_details/ProductTrustInfo'
import { ProductFAQ } from '@/components/(public)/products/ProductFAQ'
import { RelatedProductCard } from '@/components/(public)/products/product_details/RelatedProductCard'

interface ProductPageProps {
    params: Promise<{
        slug: string
    }>
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
    const { slug } = await params

    // Frontend-only dummy data: pick product by slug from DUMMY_PRODUCTS
    const product =
        DUMMY_PRODUCTS.find((p) => p.slug === slug) ?? DUMMY_PRODUCTS[0]

    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]
    const otherImages = product.images?.filter(img => img.id !== primaryImage?.id) || []

    // Extract unique colors and sizes from variants and sort them
    const colors =
        Array.from(
            new Set(
                product.variants
                    ?.map(v => v.color)
                    .filter((c): c is string => Boolean(c)),
            ),
        ).sort((a, b) => a.localeCompare(b)) || []

    const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]

    const sizes =
        Array.from(
            new Set(
                product.variants
                    ?.map(v => v.size)
                    .filter((s): s is string => Boolean(s)),
            ),
        ).sort((a, b) => {
            const indexA = SIZE_ORDER.indexOf(a.toUpperCase())
            const indexB = SIZE_ORDER.indexOf(b.toUpperCase())

            if (indexA === -1 && indexB === -1) {
                return a.localeCompare(b)
            }

            if (indexA === -1) return 1
            if (indexB === -1) return -1

            return indexA - indexB
        }) || []

    const allImages = product.images || []
    const originalPrice = product.price > 100 ? product.price * 1.2 : undefined

    // Get related products (same category, excluding current product)
    const relatedProducts = DUMMY_PRODUCTS
        .filter(p => p.id !== product.id && p.category?.id === product.category?.id)
        .slice(0, 4)

    return (
        <div className="min-h-screen bg-white dark:bg-background pb-24">
            {/* Mobile View - Modern Layout */}
            <div className="lg:hidden">
                {/* Full-width image carousel */}
                <div className="w-full">
                    <ProductImageCarousel product={product} images={allImages} />
                </div>

                {/* Content Section */}
                <div className="px-4 space-y-6 pt-6 pb-24">
                    {/* Header with rating */}
                    <div className="space-y-3">
                        <ProductHeader
                            categoryName={product.category?.name}
                            productName={product.name}
                        />
                        <ProductRating className="justify-start" />
                    </div>

                    {/* Price */}
                    <div className="py-2">
                        <ProductPrice
                            price={product.price}
                            originalPrice={originalPrice}
                            className="justify-start"
                        />
                    </div>

                    {/* Description */}
                    <ProductDescription
                        description={product.description || undefined}
                        className="text-left"
                    />

                    {/* Options */}
                    <div className="pt-2">
                        <ProductOptions colors={colors} sizes={sizes} />
                    </div>

                    {/* Trust Info */}
                    <div className="pt-2">
                        <ProductTrustInfo />
                    </div>

                    {/* Related Products - Mobile */}
                    {relatedProducts.length > 0 && (
                        <div className="pt-6 mt-4 border-t border-black/5">
                            <h2 className="text-sm font-black mb-3 uppercase tracking-widest">
                                Related Products
                            </h2>
                            <div className="grid grid-cols-3 gap-2">
                                {relatedProducts.slice(0, 3).map((relatedProduct) => (
                                    <RelatedProductCard key={relatedProduct.id} product={relatedProduct} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Bottom Bar with Add to Cart */}
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background border-t border-black/5 p-4 z-50 lg:hidden">
                    <div className="container mx-auto flex items-center gap-3">
                        <ProductFavoriteShare
                            productId={product.id}
                            variantId={product.variants?.[0]?.id}
                            className="shrink-0"
                        />
                        <Button
                            size="lg"
                            className="h-12 flex-1 rounded-2xl font-black text-sm gap-2 transition-all active:scale-[0.98]"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            Add to Cart
                        </Button>
                    </div>
                </div>
            </div>

            {/* Desktop View - Two Section Layout */}
            <div className="hidden lg:block">
                <ProductBreadcrumbs productName={product.name} />

                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 h-[calc(100vh-10rem)]">
                        {/* Left Section: Photos - 2/3 width, independently scrollable */}
                        <div className="lg:col-span-2 overflow-y-auto hide-scrollbar pr-4">
                            {/* Main Product Image */}
                            <div className="relative w-full max-w-xl mx-auto aspect-[4/3] rounded-2xl overflow-hidden bg-[#f9f9f9] dark:bg-card border border-black/5 p-4">
                                <Image
                                    src={allImages[0]?.url_image || '/placeholder-product.webp'}
                                    alt={product.name}
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 1024px) 100vw, 40vw"
                                    priority
                                />
                                {product.is_featured && (
                                    <div className="absolute top-6 left-6">
                                        <Badge className="bg-primary text-white border-none text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                                            Featured
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            {/* Related Products Section */}
                            {relatedProducts.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-black/5">
                                    <h2 className="text-lg font-black mb-4 uppercase tracking-widest">
                                        Related Products
                                    </h2>
                                    <div className="grid grid-cols-4 gap-2">
                                        {relatedProducts.map((relatedProduct) => (
                                            <RelatedProductCard key={relatedProduct.id} product={relatedProduct} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Section: Product Details - 1/3 width, independently scrollable */}
                        <div className="lg:col-span-1 overflow-y-auto hide-scrollbar">
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="space-y-3">
                                    <ProductHeader
                                        categoryName={product.category?.name}
                                        productName={product.name}
                                    />
                                    <ProductRating className="justify-start" />
                                </div>

                                {/* Price */}
                                <div className="py-4 border-t border-b border-black/5">
                                    <ProductPrice
                                        price={product.price}
                                        originalPrice={originalPrice}
                                        className="justify-start"
                                    />
                                </div>

                                {/* Description */}
                                <ProductDescription
                                    description={product.description || undefined}
                                    className="text-left"
                                />

                                {/* Options */}
                                <ProductOptions colors={colors} sizes={sizes} />

                                {/* Add to Cart */}
                                <div className="rounded-2xl border border-black/5 bg-[#f9f9f9] p-6 space-y-4">
                                    <Button
                                        size="lg"
                                        className="h-14 w-full rounded-2xl font-black text-sm gap-2 transition-all active:scale-[0.98]"
                                    >
                                        <ShoppingCart className="h-4 w-4" />
                                        Add to Cart
                                    </Button>

                                    <ProductFavoriteShare
                                        productId={product.id}
                                        variantId={product.variants?.[0]?.id}
                                    />
                                </div>

                                {/* Trust Info */}
                                <ProductTrustInfo />

                                {/* FAQ */}
                                <ProductFAQ />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
