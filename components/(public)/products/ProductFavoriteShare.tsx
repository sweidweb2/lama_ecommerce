import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WishlistButton } from '@/components/common/WishlistButton'

interface ProductFavoriteShareProps {
    productId: string
    variantId?: string
    className?: string
}

export function ProductFavoriteShare({ productId, variantId, className = '' }: ProductFavoriteShareProps) {
    return (
        <div className={`flex gap-2 ${className}`}>
            <WishlistButton
                productId={productId}
                variantId={variantId}
                className="h-12 w-12 rounded-2xl border-black/5 hover:bg-red-50 hover:text-red-500 transition-colors"
            />
            <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-2xl border-black/5 hover:bg-blue-50 hover:text-blue-500 transition-colors"
            >
                <Share2 className="h-5 w-5" />
            </Button>
        </div>
    )
}
