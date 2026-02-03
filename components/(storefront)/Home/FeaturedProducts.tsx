import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

const featuredProducts = [
    {
        id: 1,
        name: "Premium Wireless Headphones",
        category: "Electronics",
        price: 299.99,
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: 2,
        name: "Ergonomic Office Chair",
        category: "Furniture",
        price: 159.00,
        image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: 3,
        name: "Smart Fitness Watch",
        category: "Wearables",
        price: 199.50,
        image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: 4,
        name: "Classic UV Sunglasses",
        category: "Accessories",
        price: 89.99,
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop",
    },
];

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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                    <Card key={product.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300">
                        <div className="relative aspect-square w-full bg-muted overflow-hidden">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="line-clamp-1 text-lg">{product.name}</CardTitle>
                            <CardDescription>{product.category}</CardDescription>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0 flex justify-between items-center">
                            <span className="font-bold text-xl">${product.price.toFixed(2)}</span>
                            <Button size="icon" className="h-8 w-8 rounded-full" asChild>
                                <Link href={`/products/${product.id}`}>
                                    +
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </section>
    );
}
