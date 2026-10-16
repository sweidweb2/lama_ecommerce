import Image from "next/image";
import Link from "@/components/ui/link";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HOME_FEATURED_PRODUCTS } from "@/lib/constants/home-marketing";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

function RatingStars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5" aria-hidden>
            {Array.from({ length: 5 }, (_, index) => {
                const filled = rating >= index + 1;
                const half = !filled && rating >= index + 0.5;
                return (
                    <Star
                        key={index}
                        className={cn(
                            "h-3.5 w-3.5",
                            filled || half
                                ? "fill-amber-400 text-amber-400"
                                : "fill-transparent text-muted-foreground/40",
                        )}
                    />
                );
            })}
        </div>
    );
}

export function FeaturedProducts() {
    const products = HOME_FEATURED_PRODUCTS;

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="bg-background py-12 md:py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight uppercase text-foreground">
                            Featured Products
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Handpicked tees from the Aviora Wear catalog.
                        </p>
                    </div>
                    <Button variant="link" asChild className="text-primary font-medium px-0">
                        <Link href="/products">View all</Link>
                    </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                    {products.map((product) => (
                        <article
                            key={product.id}
                            className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card"
                        >
                            <Link
                                href={product.href}
                                className="relative block aspect-[4/5] bg-muted"
                                aria-label={product.name}
                            >
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                />
                                {product.badge ? (
                                    <span className="absolute left-2.5 top-2.5 rounded-full bg-emerald-800 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                        {product.badge}
                                    </span>
                                ) : null}
                            </Link>

                            <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
                                <Link href={product.href} className="block">
                                    <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
                                        {product.name}
                                    </h3>
                                </Link>

                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-bold text-foreground">
                                        {formatPrice(product.price)}
                                    </span>
                                    {product.compareAtPrice != null ? (
                                        <span className="text-xs text-muted-foreground line-through">
                                            {formatPrice(product.compareAtPrice)}
                                        </span>
                                    ) : null}
                                </div>

                                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <RatingStars rating={product.rating} />
                                        <span className="text-xs text-muted-foreground truncate">
                                            ({product.reviewCount})
                                        </span>
                                    </div>
                                    <Button
                                        asChild
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 rounded-md"
                                    >
                                        <Link
                                            href={product.href}
                                            aria-label={`View ${product.name}`}
                                        >
                                            <ShoppingCart className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
