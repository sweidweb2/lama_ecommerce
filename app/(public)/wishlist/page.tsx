import { getCurrentAuthUserFromComponent } from '@/repositories/auth.repository'
import { getWishlistItems, getWishlistItemsForGuest } from '@/services/wishlist.service'
import { ProductCard } from '@/components/common/ProductCard'
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react'
import Link from "@/components/ui/link"
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants/routes'
import { WishlistStats } from '@/components/(public)/wishlist/WishlistStats'
import { WishlistFilters } from '@/components/(public)/wishlist/WishlistFilters'
import { WishlistPagination } from '@/components/(public)/wishlist/WishlistPagination'
import { getGuestSessionId } from '@/lib/auth/guest-session'

export const metadata = {
    title: 'My Wishlist | LAMA',
    description: 'View and manage your favorite items.',
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

export default async function WishlistPage({ searchParams }: WishlistPageProps) {
    const params = await searchParams
    const user = await getCurrentAuthUserFromComponent()

    // Get wishlist items based on authentication status
    let wishlistItems: any[] = []
    
    if (user) {
        // Authenticated user → fetch wishlist by user_id
        wishlistItems = await getWishlistItems(user.id)
    } else {
        // Guest → read session cookie and fetch wishlist by session_id
        const sessionId = await getGuestSessionId()

        if (sessionId) {
            wishlistItems = await getWishlistItemsForGuest(sessionId)
        }
    }

    // Use real wishlist items (no dummy data)
    const allItems = wishlistItems

    // Apply filters
    let filteredItems = [...allItems]

    // Category filter
    if (params.category && params.category !== 'all') {
        filteredItems = filteredItems.filter(item => {
            const categorySlug = item.product.category?.slug
            const categoryId = item.product.category?.id || item.product.category_id
            return categorySlug === params.category || 
                   categoryId === params.category ||
                   String(categoryId) === params.category
        })
    }

    // Featured filter
    if (params.featured && params.featured !== 'all') {
        const isFeatured = params.featured === 'true'
        filteredItems = filteredItems.filter(item => item.product.is_featured === isFeatured)
    }

    // Trending filter
    if (params.trending && params.trending !== 'all') {
        const isTrending = params.trending === 'true'
        filteredItems = filteredItems.filter(item => item.product.is_trending === isTrending)
    }

    // Price range filter
    if (params.priceRange && params.priceRange !== 'all') {
        const [min, max] = params.priceRange.split('-').map(v => v.replace('+', ''))
        const minPrice = min ? parseFloat(min) : 0
        const maxPrice = max ? parseFloat(max) : Infinity

        filteredItems = filteredItems.filter(item => {
            const price = item.product.price
            return price >= minPrice && price <= maxPrice
        })
    }

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

            {/* Statistical Cards */}
            {allItems.length > 0 && <WishlistStats items={allItems} />}

            {/* Filters */}
            {allItems.length > 0 && <WishlistFilters />}

            {allItems.length === 0 ? (
                <div className="bg-muted/30 rounded-[2rem] border border-dashed border-border/60 py-20 text-center px-4">
                    <div className="max-w-sm mx-auto space-y-6">
                        <div className="bg-background w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-border/40">
                            <Heart className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h2 className="text-xl font-bold">Your wishlist is empty</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Looks like you haven't added anything to your wishlist yet. Explore our latest collections and find something you love.
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
                        {paginatedItems.map((item) => (
                            <div key={item.wishlist_id} className="group relative">
                                <ProductCard product={item.product} />
                                {/* Note: In a real app we might want to add a "Remove" button specifically for the wishlist view */}
                            </div>
                        ))}
                    </div>
                    <WishlistPagination totalPages={totalPages} />
                </>
            )}
        </div>
    )
}
