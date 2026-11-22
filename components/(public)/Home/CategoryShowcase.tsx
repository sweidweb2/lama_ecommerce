import Image from "next/image";
import Link from "@/components/ui/link";
import type { HomeCategory } from "@/services/category.service";

interface CategoryShowcaseProps {
    categories: HomeCategory[];
}

function formatProductCount(count: number): string {
    return `${count.toLocaleString()} Product${count === 1 ? "" : "s"}`;
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
    if (categories.length === 0) {
        return (
            <section className="py-10 md:py-16 bg-secondary">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 uppercase italic">
                        Shop by Category
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        No categories yet.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-10 md:py-16 bg-secondary">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 md:mb-8 text-center uppercase italic">
                    Shop by Category
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/products?category=${cat.slug}`}
                            className="block relative aspect-[4/5] rounded-xl md:rounded-2xl overflow-hidden group cursor-pointer bg-background border border-border"
                        >
                            {cat.imageUrl ? (
                                <div className="absolute inset-0">
                                    <Image
                                        src={cat.imageUrl}
                                        alt={cat.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                                    />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                                </div>
                            ) : null}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center p-3 ${cat.imageUrl ? "text-white" : "text-foreground"}`}>
                                <h3 className="text-sm md:text-lg font-bold text-center">
                                    {cat.name}
                                </h3>
                                <p className={`text-[10px] md:text-sm mt-1 ${cat.imageUrl ? "text-white/80" : "text-muted-foreground"}`}>
                                    {formatProductCount(cat.productCount)}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
