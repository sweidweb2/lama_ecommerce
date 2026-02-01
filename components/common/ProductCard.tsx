import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductWithRelations } from '@/types/product'
import { formatPrice } from '@/lib/utils' // I'll assume this exists or create it

interface ProductCardProps {
    product: ProductWithRelations
}

export function ProductCard({ product }: ProductCardProps) {
    const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0]
    const imageUrl = primaryImage?.url_image || '/placeholder-product.webp'

    return (
        <Link href={`/products/${product.slug}`}>
            <Card className="h-full overflow-hidden transition-all hover:shadow-lg group">
                <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {product.is_featured && (
                        <Badge className="absolute top-2 left-2" variant="secondary">
                            Featured
                        </Badge>
                    )}
                    {product.is_trending && (
                        <Badge className="absolute top-2 right-2" variant="destructive">
                            Trending
                        </Badge>
                    )}
                </div>
                <CardHeader className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            {product.category?.name || 'Uncategorized'}
                        </p>
                    </div>
                    <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                        {product.description}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <p className="text-xl font-bold">
                        {formatPrice(product.price)}
                    </p>
                    <Badge variant="outline" className="font-normal">
                        View Details
                    </Badge>
                </CardFooter>
            </Card>
        </Link>
    )
}
