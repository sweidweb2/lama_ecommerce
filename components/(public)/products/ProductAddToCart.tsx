import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProductAddToCartProps {
    className?: string
}

export function ProductAddToCart({ className = '' }: ProductAddToCartProps) {
    return (
        <div className={`pt-2 pb-4 border-b border-black/5 ${className}`}>
            <Button 
                size="lg" 
                className="h-14 w-full rounded-2xl font-black text-sm gap-2 transition-all active:scale-[0.98]"
            >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
            </Button>
        </div>
    )
}
