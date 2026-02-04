import { Star } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface ProductRatingProps {
    rating?: number
    reviewCount?: number
    isInStock?: boolean
    className?: string
}

export function ProductRating({ 
    rating = 4.8, 
    reviewCount = 128, 
    isInStock = true,
    className = ''
}: ProductRatingProps) {
    return (
        <div className={`flex items-center gap-4 font-bold ${className}`}>
            <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                <span className="text-xs">{rating}</span>
                {reviewCount && (
                    <span className="text-[10px] font-normal text-muted-foreground ml-1">
                        ({reviewCount} reviews)
                    </span>
                )}
            </div>
            <Separator orientation="vertical" className="h-3" />
            <span className="text-[10px] text-emerald-600 uppercase tracking-widest">
                {isInStock ? 'In Stock' : 'Out of Stock'}
            </span>
        </div>
    )
}
