import Image from 'next/image'
import Link from "@/components/ui/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductWithRelations } from '@/types/product'
import { formatListingPrice } from '@/lib/utils'
import { ImageIcon } from 'lucide-react'

interface ProductCardProps {
    product: ProductWithRelations
}

export function ProductCard({ product }: ProductCardProps) {
    const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0]
    const hasImage = primaryImage?.url_image
    const productSlug = product.slug

    return (
        <Link
            href={`/products/${productSlug}`}
            className="block h-full group"
            aria-label={`View details for ${product.name}`}
            title={product.name}
        >
            <Card className="h-full border-none shadow-none bg-transparent overflow-hidden transition-all duration-300">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted border border-border/40">
                    {hasImage ? (
                        <Image
                            src={primaryImage.url_image}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                <ImageIcon className="h-12 w-12 opacity-50" />
                                <span className="text-xs opacity-75">No Image</span>
                            </div>
                        </div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.is_featured && (
                            <Badge className="bg-primary/90 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 border-none" variant="secondary">
                                Featured
                            </Badge>
                        )}
                        {product.is_trending && (
                            <Badge className="bg-destructive/90 backdrop-blur-sm text-[10px] px-1.5 py-0.5 border-none">
                                Hot
                            </Badge>
                        )}
                        {product.is_out_of_stock && (
                            <Badge className="bg-muted-foreground/90 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 border-none">
                                Out of Stock
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="-mt-2 pb-1 px-1 flex flex-col gap-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold truncate">
                        {product.category?.name || 'Uncategorized'}
                    </p>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                    <p className="text-base font-bold text-primary">
                        {formatListingPrice(product)}
                    </p>
                </div>
            </Card>
        </Link>
    )
}
