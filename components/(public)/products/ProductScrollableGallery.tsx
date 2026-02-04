import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { ProductWithRelations } from '@/types/product'

interface ProductScrollableGalleryProps {
    product: ProductWithRelations
    images: Array<{ id: string; url_image: string; is_primary?: boolean }>
}

export function ProductScrollableGallery({ product, images }: ProductScrollableGalleryProps) {
    return (
        <div className="flex flex-col gap-4">
            {images.map((image, index) => (
                <div
                    key={image.id ?? index}
                    className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#f9f9f9] dark:bg-card border border-black/5 shrink-0 p-6"
                >
                    <Image
                        src={image.url_image || '/placeholder-product.webp'}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 50vw, 40vw"
                        priority={index === 0}
                    />
                    {index === 0 && product.is_featured && (
                        <div className="absolute top-4 left-4">
                            <Badge className="bg-primary text-white border-none text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                                Featured
                            </Badge>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
