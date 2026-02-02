import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ProductWithRelations } from '@/types/product'
import { formatPrice } from '@/lib/utils'
import { WishlistButton } from '@/components/common/WishlistButton'

interface RelatedProductCardProps {
    product: ProductWithRelations
}

export function RelatedProductCard({ product }: RelatedProductCardProps) {
    const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0]
    const imageUrl = primaryImage?.url_image || '/placeholder-product.webp'

    return (
        <Link href={`/products/${product.slug}`} className="block h-full group">
            <div className="h-full overflow-hidden transition-all duration-300">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted border border-border/40">
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                        {product.is_featured && (
                            <Badge className="bg-primary/90 backdrop-blur-sm text-[8px] px-1 py-0.5 border-none" variant="secondary">
                                Featured
                            </Badge>
                        )}
                        {product.is_trending && (
                            <Badge className="bg-destructive/90 backdrop-blur-sm text-[8px] px-1 py-0.5 border-none">
                                Hot
                            </Badge>
                        )}
                    </div>

                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <WishlistButton
                            productId={product.id}
                            variantId={product.variants?.[0]?.id}
                            size="icon"
                            className="h-6 w-6 rounded-md bg-background/80 border-none"
                        />
                    </div>
                </div>
                <div className="pt-2 pb-1 px-0.5 flex flex-col gap-0.5">
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold truncate">
                        {product.category?.name || 'Uncategorized'}
                    </p>
                    <h3 className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                    <p className="text-sm font-bold text-primary">
                        {formatPrice(product.price)}
                    </p>
                </div>
            </div>
        </Link>
    )
}
