import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { ProductWithRelations } from '@/types/product'

interface ProductImageCarouselProps {
    product: ProductWithRelations
    images: Array<{ id: string; url_image: string; is_primary?: boolean }>
}

export function ProductImageCarousel({ product, images }: ProductImageCarouselProps) {
    const primaryImage = images.find(img => img.is_primary) || images[0]

    return (
        <div className="relative w-full h-[50vh] overflow-hidden">
            <div className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth h-full hide-scrollbar">
                {images.map((image, index) => (
                    <div
                        key={image.id ?? index}
                        className="relative min-w-full w-full h-full flex items-center justify-center p-4 bg-[#f9f9f9] dark:bg-card snap-center"
                    >
                        <div className="relative w-full h-full">
                            <Image
                                src={image.url_image || '/placeholder-product.webp'}
                                alt={product.name}
                                fill
                                className="object-contain"
                                sizes="100vw"
                                priority={index === 0}
                            />
                            {index === 0 && product.is_featured && (
                                <div className="absolute top-0 left-0">
                                    <Badge className="bg-primary text-white border-none text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                                        Featured
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
