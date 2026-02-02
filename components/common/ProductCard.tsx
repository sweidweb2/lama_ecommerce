import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductWithRelations } from '@/types/product'
import { formatPrice } from '@/lib/utils'
import { WishlistButton } from './WishlistButton'

interface ProductCardProps {
    product: ProductWithRelations
}

export function ProductCard({ product }: ProductCardProps) {
    const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0]
    const imageUrl = primaryImage?.url_image || '/placeholder-product.webp'

    return (
        <Link href={`/products/${product.slug}`} className="block h-full group">
            <Card className="h-full border-none shadow-none bg-transparent overflow-hidden transition-all duration-300">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted border border-border/40">
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.is_featured && (
                            <Badge className="bg-primary/90 backdrop-blur-sm text-[10px] px-1.5 py-0.5 border-none" variant="secondary">
                                Featured
                            </Badge>
                        )}
                        {product.is_trending && (
                            <Badge className="bg-destructive/90 backdrop-blur-sm text-[10px] px-1.5 py-0.5 border-none">
                                Hot
                            </Badge>
                        )}
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <WishlistButton
                            productId={product.id}
                            variantId={product.variants?.[0]?.id}
                            size="icon"
                            className="h-8 w-8 rounded-lg bg-background/80 border-none"
                        />
                    </div>
                </div>
                <div className="pt-3 pb-1 px-1 flex flex-col gap-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold truncate">
                        {product.category?.name || 'Uncategorized'}
                    </p>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                    <p className="text-base font-bold text-primary">
                        {formatPrice(product.price)}
                    </p>
                </div>
            </Card>
        </Link>
    )
}
