import { formatPrice } from '@/lib/utils'

interface ProductPriceProps {
    price: number
    originalPrice?: number
    className?: string
}

export function ProductPrice({ price, originalPrice, className = '' }: ProductPriceProps) {
    return (
        <div className={`flex items-baseline gap-3 ${className}`}>
            <span className="text-3xl sm:text-4xl font-black text-foreground">
                {formatPrice(price)}
            </span>
            {originalPrice && originalPrice > price && (
                <span className="text-sm md:text-base text-muted-foreground line-through font-medium opacity-40">
                    {formatPrice(originalPrice)}
                </span>
            )}
        </div>
    )
}
