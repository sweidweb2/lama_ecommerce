import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, ArrowLeft, Star, ShoppingCart, Heart, Share2 } from 'lucide-react'
import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import { getProductBySlug } from '@/services/products.service'
import { DUMMY_PRODUCTS } from '@/lib/constants/dummy-data'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface ProductPageProps {
    params: Promise<{
        slug: string
    }>
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
    const { slug } = await params
    const supabase = await createSupabaseServerComponentClient()

    // 1. Try to fetch from database
    let product = await getProductBySlug(supabase, slug)

    // 2. Fallback to dummy data
    if (!product) {
        product = DUMMY_PRODUCTS.find(p => p.slug === slug) || null
    }

    if (!product) {
        notFound()
    }

    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]
    const otherImages = product.images?.filter(img => img.id !== primaryImage?.id) || []

    // Extract unique colors and sizes from variants
    const colors = Array.from(new Set(product.variants?.map(v => v.color).filter(Boolean)))
    const sizes = Array.from(new Set(product.variants?.map(v => v.size).filter(Boolean)))

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Breadcrumbs */}
            <div className="border-b">
                <div className="container mx-auto px-4 h-12 flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                    <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                    <span className="text-foreground font-medium truncate">{product.name}</span>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <Link href="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 group transition-colors">
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to products
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                    {/* Left: Product Media & Core Info (Integrated for mobile) */}
                    <div className="md:col-span-7 space-y-6">
                        <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[200px_1fr] md:block gap-6">
                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-md border border-border/40">
                                <Image
                                    src={primaryImage?.url_image || '/placeholder-product.webp'}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="(max-width: 768px) 140px, (max-width: 1200px) 50vw, 33vw"
                                />
                                {product.is_featured && (
                                    <Badge className="absolute top-2 left-2 md:top-4 md:left-4 bg-primary text-primary-foreground shadow-lg px-2 py-0 md:px-3 md:py-1 scale-75 md:scale-100 origin-top-left text-[10px] md:text-xs">
                                        Premium
                                    </Badge>
                                )}
                            </div>

                            {/* This block only shows on mobile/tablet next to the image */}
                            <div className="md:hidden flex flex-col justify-center gap-1 sm:gap-3">
                                <Badge variant="outline" className="w-fit rounded-full text-[10px] sm:text-xs text-primary border-primary/20 bg-primary/5">
                                    {product.category?.name || 'Uncategorized'}
                                </Badge>
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight line-clamp-2">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl sm:text-3xl font-bold text-primary">
                                        {formatPrice(product.price)}
                                    </span>
                                </div>
                                <p className="text-emerald-600 text-xs font-semibold">In Stock</p>
                            </div>
                        </div>

                        {otherImages.length > 0 && (
                            <div className="grid grid-cols-4 gap-4 hidden md:grid">
                                {product.images?.map((image) => (
                                    <div key={image.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border/40 hover:border-primary/50 transition-colors cursor-pointer group">
                                        <Image
                                            src={image.url_image}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                            sizes="20vw"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Details & Options */}
                    <div className="md:col-span-5 flex flex-col justify-between">
                        <div className="space-y-6">
                            {/* Desktop-only Header */}
                            <div className="hidden md:block space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="rounded-full text-primary border-primary/20 bg-primary/5">
                                        {product.category?.name || 'Uncategorized'}
                                    </Badge>
                                    {product.is_trending && (
                                        <Badge className="rounded-full bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200">
                                            Trending
                                        </Badge>
                                    )}
                                </div>
                                <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">{product.name}</h1>
                                <div className="flex items-center gap-4 text-sm mt-2">
                                    <div className="flex items-center text-yellow-500">
                                        <Star className="h-4 w-4 fill-current" />
                                        <Star className="h-4 w-4 fill-current" />
                                        <Star className="h-4 w-4 fill-current" />
                                        <Star className="h-4 w-4 fill-current" />
                                        <Star className="h-4 w-4 fill-current opacity-50" />
                                        <span className="ml-2 text-muted-foreground font-medium">4.8 (124 reviews)</span>
                                    </div>
                                    <Separator orientation="vertical" className="h-4" />
                                    <p className="text-emerald-600 font-medium">In Stock</p>
                                </div>
                            </div>

                            <Separator className="opacity-50 hidden md:block" />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg">Description</h3>
                                    {/* Mobile Rating */}
                                    <div className="md:hidden flex items-center text-yellow-500 text-sm">
                                        <Star className="h-3 w-3 fill-current" />
                                        <span className="ml-1 text-muted-foreground font-semibold">4.8</span>
                                    </div>
                                </div>
                                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                                    {product.description || 'No description available for this product.'}
                                </p>
                            </div>

                            {/* Desktop-only Price Section */}
                            <div className="hidden md:block space-y-4 pt-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-muted-foreground font-medium">Price</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-primary">{formatPrice(product.price)}</span>
                                        {product.price > 100 && (
                                            <span className="text-lg text-muted-foreground line-through opacity-60">
                                                {formatPrice(product.price * 1.2)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Options Section */}
                            <div className="space-y-8 pt-6">
                                {colors.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Color</label>
                                            <span className="text-xs text-primary font-medium">{colors.length} Available</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {colors.map((color) => (
                                                <button
                                                    key={color}
                                                    className="px-4 py-2 border-2 rounded-xl text-sm font-semibold transition-all hover:bg-primary/5 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                >
                                                    {color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {sizes.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Size</label>
                                            <Link href="#size-guide" className="text-xs text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">Size Guide</Link>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {sizes.map((size) => (
                                                <button
                                                    key={size}
                                                    className="w-12 h-12 flex items-center justify-center border-2 rounded-xl text-sm font-bold transition-all hover:bg-primary/5 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-10">
                                <Button size="lg" className="flex-1 h-16 rounded-2xl text-lg font-bold gap-3 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-[0.98]">
                                    <ShoppingCart className="h-6 w-6" />
                                    Add to Cart
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" className="h-16 w-16 rounded-2xl border-2 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors active:scale-[0.98]">
                                        <Heart className="h-6 w-6" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-16 w-16 rounded-2xl border-2 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 transition-colors active:scale-[0.98]">
                                        <Share2 className="h-6 w-6" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info Cards */}
                        <div className="grid grid-cols-2 gap-4 mt-12 bg-muted/30 p-4 rounded-2xl border border-border/40">
                            <div className="text-center p-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Free Shipping</p>
                                <p className="text-xs font-semibold">Orders over $150</p>
                            </div>
                            <div className="text-center p-2 border-l">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Easy Returns</p>
                                <p className="text-xs font-semibold">30-day window</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
