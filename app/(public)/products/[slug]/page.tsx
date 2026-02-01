import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, ArrowLeft, Star, ShoppingCart, Heart, Share2, ShieldCheck, Truck, RotateCcw } from 'lucide-react'
import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import { getProductBySlug } from '@/services/products.service'
import { DUMMY_PRODUCTS } from '@/lib/constants/dummy-data'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

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
        <div className="min-h-screen bg-white dark:bg-background pb-20">
            {/* Simple Breadcrumbs */}
            <div className="container mx-auto px-4 py-4 md:py-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest overflow-hidden">
                    <Link href="/" className="hover:text-primary transition-colors shrink-0">Home</Link>
                    <ChevronRight className="h-3 w-3 shrink-0" />
                    <Link href="/products" className="hover:text-primary transition-colors shrink-0">Products</Link>
                    <ChevronRight className="h-3 w-3 shrink-0" />
                    <span className="text-foreground truncate opacity-50">{product.name}</span>
                </div>
            </div>

            <div className="container mx-auto px-4">
                {/* Main Product Section: Stacked on Mobile, Grid on Desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">

                    {/* Visual Section (Top on Mobile, Left on Desktop) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="relative aspect-square bg-[#f9f9f9] dark:bg-card rounded-3xl md:rounded-[2rem] overflow-hidden group mx-auto w-full max-w-[320px] sm:max-w-[450px] lg:max-w-none shadow-sm border border-black/5">
                            <Image
                                src={primaryImage?.url_image || '/placeholder-product.webp'}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 640px) 320px, (max-width: 1024px) 450px, 40vw"
                            />
                            {product.is_featured && (
                                <div className="absolute top-4 left-4">
                                    <Badge className="bg-primary text-white border-none text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-md">
                                        Featured
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails - Centered on Mobile */}
                        {otherImages.length > 0 && (
                            <div className="flex justify-center gap-3 overflow-x-auto py-2">
                                {product.images?.map((image) => (
                                    <div key={image.id} className="relative h-14 w-14 md:h-16 md:w-16 shrink-0 rounded-xl md:rounded-2xl overflow-hidden bg-[#f9f9f9] border border-black/5 cursor-pointer hover:border-primary/20 transition-all">
                                        <Image
                                            src={image.url_image}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Section (Below on Mobile, Right on Desktop) */}
                    <div className="lg:col-span-8 space-y-6 md:space-y-8 flex flex-col">
                        {/* 1. Header Info */}
                        <div className="space-y-2 md:space-y-4 text-center lg:text-left">
                            <div className="space-y-1">
                                <p className="text-primary font-bold text-[10px] uppercase tracking-widest opacity-70">
                                    {product.category?.name || 'Collection'}
                                </p>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
                                    {product.name}
                                </h1>
                            </div>

                            <div className="flex items-center justify-center lg:justify-start gap-4 font-bold">
                                <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                                    <span className="text-xs">4.8</span>
                                </div>
                                <Separator orientation="vertical" className="h-3" />
                                <span className="text-[10px] text-emerald-600 uppercase tracking-widest">In Stock</span>
                            </div>
                        </div>

                        {/* 2. Description */}
                        <div className="space-y-2 py-4 border-t border-black/5 text-center lg:text-left">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">About this product</h3>
                            <p className="text-muted-foreground leading-relaxed text-sm md:text-base font-medium max-w-2xl mx-auto lg:mx-0">
                                {product.description || 'Premium quality materials and contemporary design combine to create this essential piece for your collection.'}
                            </p>
                        </div>

                        {/* 3. Price Area */}
                        <div className="py-4 border-t border-black/5 text-center lg:text-left">
                            <div className="flex items-baseline justify-center lg:justify-start gap-3">
                                <span className="text-3xl sm:text-4xl font-black text-foreground">{formatPrice(product.price)}</span>
                                {product.price > 100 && (
                                    <span className="text-sm md:text-base text-muted-foreground line-through font-medium opacity-40">
                                        {formatPrice(product.price * 1.2)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 4. Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-4">
                            {colors.length > 0 && (
                                <div className="space-y-3 text-center lg:text-left">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Color</label>
                                    <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                                        {colors.map((color) => (
                                            <button
                                                key={color}
                                                className="px-4 py-2 border rounded-xl text-xs font-bold hover:border-primary transition-all active:scale-95 whitespace-nowrap"
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {sizes.length > 0 && (
                                <div className="space-y-3 text-center lg:text-left">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Size</label>
                                    <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                                        {sizes.map((size) => (
                                            <button
                                                key={size}
                                                className="w-10 h-10 flex items-center justify-center border rounded-xl text-xs font-bold hover:border-primary transition-all active:scale-95"
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 5. Add to Cart Area */}
                        <div className="pt-6 pb-6 border-b border-black/5">
                            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0">
                                <Button size="lg" className="h-14 flex-1 rounded-2xl font-black text-sm gap-2 shadow-lg shadow-primary/10 transition-all active:scale-[0.98]">
                                    <ShoppingCart className="h-4 w-4" />
                                    Add to Cart
                                </Button>
                                <div className="flex gap-2 justify-center">
                                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-black/5 hover:bg-red-50 hover:text-red-500 transition-colors">
                                        <Heart className="h-5 w-5" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-black/5 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                                        <Share2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* 6. Trust Info */}
                        <div className="grid grid-cols-3 gap-2 pt-6">
                            <div className="bg-[#f9f9f9] p-3 rounded-2xl text-center space-y-1">
                                <Truck className="h-4 w-4 mx-auto text-primary opacity-60" />
                                <p className="text-[8px] font-black uppercase tracking-tighter leading-none">Fast Shipping</p>
                            </div>
                            <div className="bg-[#f9f9f9] p-3 rounded-2xl text-center space-y-1">
                                <ShieldCheck className="h-4 w-4 mx-auto text-primary opacity-60" />
                                <p className="text-[8px] font-black uppercase tracking-tighter leading-none">Security Pay</p>
                            </div>
                            <div className="bg-[#f9f9f9] p-3 rounded-2xl text-center space-y-1">
                                <RotateCcw className="h-4 w-4 mx-auto text-primary opacity-60" />
                                <p className="text-[8px] font-black uppercase tracking-tighter leading-none">30-Day returns</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ / Questions Section */}
                <div className="mt-20 max-w-2xl mx-auto border-t pt-16">
                    <h2 className="text-xl font-black tracking-tight mb-8 text-center uppercase tracking-widest">Questions & Answers</h2>

                    <Accordion type="single" collapsible className="w-full space-y-2">
                        <AccordionItem value="item-1" className="border-none bg-[#f9f9f9] rounded-2xl px-6">
                            <AccordionTrigger className="hover:no-underline py-4 text-xs font-bold uppercase tracking-wider text-left">
                                What is the shipping time for this product?
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 text-muted-foreground text-[10px] font-medium leading-loose">
                                Standard shipping usually takes 3-5 business days. Express shipping options are available at checkout if you need it sooner.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2" className="border-none bg-[#f9f9f9] rounded-2xl px-6">
                            <AccordionTrigger className="hover:no-underline py-4 text-xs font-bold uppercase tracking-wider text-left">
                                Is there a warranty included?
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 text-muted-foreground text-[10px] font-medium leading-loose">
                                Yes, every product comes with a 12-month manufacturer warranty covering any defects in materials or workmanship.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3" className="border-none bg-[#f9f9f9] rounded-2xl px-6">
                            <AccordionTrigger className="hover:no-underline py-4 text-xs font-bold uppercase tracking-wider text-left">
                                What is the return policy?
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 text-muted-foreground text-[10px] font-medium leading-loose">
                                We offer a 30-day hassle-free return policy. If you're not completely satisfied, you can return the product in its original packaging for a full refund.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    )
}
