import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { DUMMY_PRODUCTS } from "@/lib/constants/dummy-data";

// Get featured products from dummy data
const featuredProducts = DUMMY_PRODUCTS.filter(p => p.is_featured).slice(0, 4);

export function FeaturedProducts() {
    return (
        <section className="py-16 container mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold italic tracking-tight uppercase">Featured Products</h2>
                    <p className="text-muted-foreground mt-2">Our handpicked selection of top products.</p>
                </div>
                <Button variant="link" asChild className="text-primary font-medium">
                    <Link href="/products">View All</Link>
                </Button>
            </div>
            {/* On mobile show 2 smaller cards per row */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {featuredProducts.map((product) => (
                    <Link key={product.id} href={`/products/${product.slug}`} className="block">
                        <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300">
                            <div className="relative aspect-[4/5] w-full bg-muted overflow-hidden">
                                <Image
                                    src={product.images?.[0]?.url_image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop"}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>
                            <CardHeader className="p-3 pb-1">
                                <CardTitle className="line-clamp-1 text-sm sm:text-base">{product.name}</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">{product.category?.name || "Uncategorized"}</CardDescription>
                            </CardHeader>
                            <CardFooter className="p-3 pt-0 flex justify-between items-center">
                                <span className="font-bold text-sm sm:text-base">${product.price.toFixed(2)}</span>
                                <Button size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full text-xs">
                                    +
                                </Button>
                            </CardFooter>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}
