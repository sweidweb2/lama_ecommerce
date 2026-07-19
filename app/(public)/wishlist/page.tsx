import { getCurrentAuthUserFromComponent } from '@/repositories/auth.repository'
import { getWishlistItems, getWishlistItemsForGuest } from '@/services/wishlist.service'
import { UnavailableWishlistCard } from '@/components/(public)/wishlist/UnavailableWishlistCard'
import { WishlistItemCard } from '@/components/(public)/wishlist/WishlistItemCard'
import { Heart, ArrowRight, AlertCircle } from 'lucide-react'
import Link from "@/components/ui/link"
import { Button } from '@/components/ui/button'
import { WishlistStats } from '@/components/(public)/wishlist/WishlistStats'
import { WishlistFilters } from '@/components/(public)/wishlist/WishlistFilters'
import { WishlistPagination } from '@/components/(public)/wishlist/WishlistPagination'
import { getGuestSessionId } from '@/lib/auth/guest-session'
import { filterWishlistItems } from '@/lib/wishlist/filter-wishlist-items'
import type { ProductWithRelations } from '@/types/product'

export const metadata = {
    title: 'My Wishlist',
    description: 'View and manage your favorite items.',
}

interface WishlistPageItem {
    wishlist_id: string
    customised_product_id: string
    variant: {
        id: string
        color: string | null
        size: string | null
        material: string | null
    }
    product: ProductWithRelations | null
    isUnavailable: boolean
    unitPrice: number
}

interface WishlistPageProps {
    searchParams: Promise<{
        category?: string
        featured?: string
        trending?: string
        priceRange?: string
        page?: string
    }>
}

function categoriesFromWishlistItems(items: WishlistPageItem[]) {
    const byValue = new Map<string, string>()

    for (const item of items) {
        if (item.isUnavailable || !item.product?.category) continue

        const category = item.product.category
        const value = category.slug?.trim() || category.id
        if (!value || byValue.has(value)) continue

        byValue.set(value, category.name)
    }

    return [...byValue.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label))
}

export default async function WishlistPage({ searchParams }: WishlistPageProps) {
    const params = await searchParams
    const user = await getCurrentAuthUserFromComponent()

    let wishlistItems: WishlistPageItem[] = []
    let loadError: string | null = null

    if (user) {
        const result = await getWishlistItems(user.id)
        if (!result.success) {
            loadError = result.error
        } else {
            wishlistItems = result.data as WishlistPageItem[]
        }
    } else {
        const sessionId = await getGuestSessionId()

        if (sessionId) {
            const result = await getWishlistItemsForGuest(sessionId)
            if (!result.success) {
                loadError = result.error
            } else {
                wishlistItems = result.data as WishlistPageItem[]
            }
        }
    }

    if (loadError) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
                <div className="mb-10">
                    <h1 className="text-4xl font-black tracking-tight text-foreground">
                        My Wishlist
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        The pieces you love, all in one place.
                    </p>
                </div>
                <div className="bg-muted/30 rounded-[2rem] border border-dashed border-border/60 py-20 text-center px-4">
                    <div className="max-w-sm mx-auto space-y-6">
                        <div className="bg-background w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-border/40">
                            <AlertCircle className="h-8 w-8 text-destructive/70" />
                        </div>
                        <h2 className="text-xl font-bold">Couldn&apos;t load your wishlist</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {loadError}
                        </p>
                        <Link href="/wishlist" className="inline-block mt-4">
                            <Button size="lg" className="rounded-xl px-8">
                                Try again
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const allItems = wishlistItems
    const categoryOptions = categoriesFromWishlistItems(allItems)
    const filteredItems = filterWishlistItems(allItems, params)

    // Pagination
    const itemsPerPage = 15
    const currentPage = Number(params.page) || 1
    const totalItems = filteredItems.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedItems = filteredItems.slice(startIndex, endIndex)

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                        My Wishlist
                        {allItems.length > 0 && (
                            <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                                {totalItems}
                            </span>
                        )}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        The pieces you love, all in one place.
                    </p>
                </div>

                {allItems.length > 0 && (
                    <Link href="/products">
                        <Button variant="ghost" className="group text-sm font-bold uppercase tracking-widest gap-2">
                            Continue Shopping
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                )}
            </div>

            {allItems.length > 0 && <WishlistStats items={allItems} />}

            {allItems.length > 0 && <WishlistFilters categories={categoryOptions} />}

            {allItems.length === 0 ? (
                <div className="bg-muted/30 rounded-[2rem] border border-dashed border-border/60 py-20 text-center px-4">
                    <div className="max-w-sm mx-auto space-y-6">
                        <div className="bg-background w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-border/40">
                            <Heart className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h2 className="text-xl font-bold">Your wishlist is empty</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Looks like you haven&apos;t added anything to your wishlist yet. Explore our latest collections and find something you love.
                        </p>
                        <Link href="/products" className="inline-block mt-4">
                            <Button size="lg" className="rounded-xl px-8">
                                Explore Products
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-muted/30 rounded-[2rem] border border-dashed border-border/60 py-20 text-center px-4">
                    <div className="max-w-sm mx-auto space-y-6">
                        <div className="bg-background w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-border/40">
                            <Heart className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h2 className="text-xl font-bold">No items match your filters</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Try adjusting your filters to see more items.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                        {paginatedItems.map((item) =>
                            item.isUnavailable || !item.product ? (
                                <UnavailableWishlistCard
                                    key={item.wishlist_id}
                                    wishlistId={item.wishlist_id}
                                />
                            ) : (
                                <WishlistItemCard
                                    key={item.wishlist_id}
                                    wishlistId={item.wishlist_id}
                                    customisedProductId={item.customised_product_id}
                                    product={item.product}
                                    variant={item.variant}
                                />
                            ),
                        )}
                    </div>
                    <WishlistPagination totalPages={totalPages} />
                </>
            )}
        </div>
    )
}
