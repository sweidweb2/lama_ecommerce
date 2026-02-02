import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import { getWishlistItems } from '@/services/wishlist.service'
import { ProductCard } from '@/components/common/ProductCard'
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants/routes'

export const metadata = {
    title: 'My Wishlist | LAMA',
    description: 'View and manage your favorite items.',
}

export default async function AccountWishlistPage() {
    const supabase = await createSupabaseServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="max-w-md mx-auto space-y-6">
                    <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Your wishlist is waiting</h1>
                    <p className="text-muted-foreground">
                        Sign in to see your saved items and sync them across all your devices.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                        <Link href={ROUTES.LOGIN}>
                            <Button size="lg" className="w-full sm:w-auto rounded-xl">
                                Sign In
                            </Button>
                        </Link>
                        <Link href={ROUTES.SIGNUP}>
                            <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-xl">
                                Create Account
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const wishlistItems = await getWishlistItems(supabase, user.id)

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                        My Wishlist
                        {wishlistItems.length > 0 && (
                            <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                                {wishlistItems.length}
                            </span>
                        )}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        The pieces you love, all in one place.
                    </p>
                </div>

                {wishlistItems.length > 0 && (
                    <Link href="/products">
                        <Button variant="ghost" className="group text-sm font-bold uppercase tracking-widest gap-2">
                            Continue Shopping
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                )}
            </div>

            {wishlistItems.length === 0 ? (
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
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                    {wishlistItems.map((item) => (
                        <div key={item.wishlist_id} className="group relative">
                            <ProductCard product={item.product} />
                            {/* Note: In a real app we might want to add a "Remove" button specifically for the wishlist view */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

