'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toggleWishlistAction } from '@/actions/wishlist'
import { toast } from 'sonner'
import { useAuth } from '@/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants/routes'

interface WishlistButtonProps {
    productId: string
    variantId?: string
    initialIsInWishlist?: boolean
    showText?: boolean
    className?: string
    variant?: 'outline' | 'ghost' | 'secondary' | 'default'
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function WishlistButton({
    productId,
    variantId,
    initialIsInWishlist = false,
    showText = false,
    className,
    variant = 'outline',
    size = 'icon'
}: WishlistButtonProps) {
    const [isInWishlist, setIsInWishlist] = useState(initialIsInWishlist)
    const [isPending, startTransition] = useTransition()
    const { user } = useAuth()
    const router = useRouter()

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!user) {
            toast.error('Please sign in to add items to your wishlist')
            router.push(ROUTES.LOGIN)
            return
        }

        // Use variantId if provided, otherwise assume first variant (in a real app we might need to fetch it)
        // For now, if variantId is not provided, we might need a more robust way to handle it.
        // If this is called from ProductCard, we might need to pass the first variant's ID.
        if (!variantId) {
            toast.error('Product variation not selected.')
            return
        }

        // Optimistic update
        const prevStatus = isInWishlist
        setIsInWishlist(!prevStatus)

        startTransition(async () => {
            try {
                const result = await toggleWishlistAction(variantId)
                if (!result.success) {
                    setIsInWishlist(prevStatus)
                    toast.error(result.error || 'Failed to update wishlist')
                } else {
                    toast.success(prevStatus ? 'Removed from wishlist' : 'Added to wishlist')
                }
            } catch (error) {
                setIsInWishlist(prevStatus)
                toast.error('An unexpected error occurred')
            }
        })
    }

    return (
        <Button
            variant={variant}
            size={size}
            className={cn(
                'rounded-2xl transition-all duration-300 active:scale-95',
                isInWishlist ? 'text-red-500 border-red-100 bg-red-50 hover:bg-red-100 hover:text-red-600' : 'text-muted-foreground',
                className
            )}
            onClick={handleToggle}
            disabled={isPending}
        >
            <Heart
                className={cn(
                    'h-5 w-5 transition-all duration-300 text-white',
                    isInWishlist ? 'fill-current' : 'fill-transparent',
                    isPending && 'scale-90 opacity-50'
                )}
            />
            {showText && (
                <span className="ml-2 font-bold uppercase tracking-widest text-[10px]">
                    {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                </span>
            )}
        </Button>
    )
}
