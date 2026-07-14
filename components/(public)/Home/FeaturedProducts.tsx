import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import Link from "@/components/ui/link";
import { Eye, ImageIcon } from "lucide-react";
import { getProducts } from "@/services/product.service";
import { formatListingPrice } from "@/lib/utils";

async function getFeaturedProducts() {
    try {
        const { data } = await getProducts({
            page: 1,
            pageSize: 12,
            isFeatured: true,
            sort: "created_at-desc",
        });
        return data;
    } catch (error) {
        console.error("Error fetching featured products:", error);
        return [];
    }
}

export async function FeaturedProducts() {
    const featuredProducts = await getFeaturedProducts();

    if (featuredProducts.length === 0) {
        return null;
    }

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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {featuredProducts.map((product) => {
                    const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
                    const hasImage = primaryImage?.url_image;

                    return (
                        <Link key={product.id} href={`/products/${product.slug}`} className="block">
                            <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 pt-0 gap-0 py-0">
                                <div className="relative aspect-square w-full bg-muted overflow-hidden">
                                    {hasImage ? (
                                        <Image
                                            src={primaryImage.url_image}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted">
                                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                <ImageIcon className="h-12 w-12 opacity-50" />
                                                <span className="text-xs opacity-75">No Image</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <CardHeader className="px-3 py-2 pb-1.5 -mt-2">
                                    <CardTitle className="line-clamp-1 text-sm font-semibold leading-tight">{product.name}</CardTitle>
                                    <CardDescription className="text-xs leading-tight mt-1">{product.category?.name || "Uncategorized"}</CardDescription>
                                </CardHeader>
                                <CardFooter className="px-3 py-2 pt-1.5 flex justify-between items-center">
                                    <span className="font-bold text-base leading-tight">{formatListingPrice(product)}</span>
                                    <Button size="icon" className="h-8 w-8 rounded-full hover:scale-110 transition-transform">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
