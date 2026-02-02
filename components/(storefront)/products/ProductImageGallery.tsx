import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { ProductWithRelations } from '@/types/product'

interface ProductImageGalleryProps {
    product: ProductWithRelations
    primaryImage: { id: string; url_image: string; is_primary?: boolean } | undefined
    otherImages: Array<{ id: string; url_image: string; is_primary?: boolean }>
}

export function ProductImageGallery({ product, primaryImage, otherImages }: ProductImageGalleryProps) {
    return (
        <div className="space-y-6">
            <div className="relative aspect-square bg-[#f9f9f9] dark:bg-card rounded-[2rem] overflow-hidden group mx-auto w-full max-w-[450px] lg:max-w-none border border-black/5">
                <Image
                    src={primaryImage?.url_image || '/placeholder-product.webp'}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 450px, 40vw"
                />
                {product.is_featured && (
                    <div className="absolute top-4 left-4">
                                    <Badge className="bg-primary text-white border-none text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                            Featured
                        </Badge>
                    </div>
                )}
            </div>

            {otherImages.length > 0 && (
                <div className="flex justify-center gap-3 overflow-x-auto py-2">
                    {[primaryImage, ...otherImages].filter(Boolean).map((image) => (
                        <div
                            key={image!.id}
                            className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-[#f9f9f9] border border-black/5 cursor-pointer hover:border-primary/20 transition-all"
                        >
                            <Image
                                src={image!.url_image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
