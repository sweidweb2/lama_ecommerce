import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductPrice } from './ProductPrice'

interface ProductBuyBoxProps {
    price: number
    originalPrice?: number
}

export function ProductBuyBox({ price, originalPrice }: ProductBuyBoxProps) {
    return (
        <div className="hidden lg:flex w-full max-w-xs flex-col gap-4 rounded-2xl border border-black/5 bg-[#f9f9f9] p-4">
            <ProductPrice price={price} originalPrice={originalPrice} />

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
