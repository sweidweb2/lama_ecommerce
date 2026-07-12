import Image from "next/image";
import Link from "@/components/ui/link";

export function CategoryShowcase() {
    const categories = [
        { name: "Electronics", slug: "electronics", count: "1,200 Products", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop" },
        { name: "Fashion", slug: "fashion", count: "850 Products", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1000&auto=format&fit=crop" },
        { name: "Home & Garden", slug: "home-garden", count: "430 Products", image: "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?q=80&w=1000&auto=format&fit=crop" },
        { name: "Beauty", slug: "beauty", count: "210 Products", image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1000&auto=format&fit=crop" },
    ];

    return (
        <section className="py-10 md:py-16 bg-muted/50">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 md:mb-8 text-center uppercase italic">
                    Shop by Category
                </h2>
                {/* Smaller categories, 2 per row on mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                    {categories.map((cat) => (
                        <Link
                            key={cat.name}
                            href={`/products?category=${cat.slug}`}
                            className="block relative aspect-[4/5] rounded-xl md:rounded-2xl overflow-hidden group cursor-pointer"
                        >
                            <div className="absolute inset-0">
                                <Image
                                    src={cat.image}
                                    alt={cat.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                                />
                            </div>
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-3">
                                <h3 className="text-sm md:text-lg font-bold text-center">{cat.name}</h3>
                                <p className="text-white/80 text-[10px] md:text-sm mt-1">{cat.count}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

