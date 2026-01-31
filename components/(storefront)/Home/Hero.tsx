import { Button } from "@/components/ui/button";

export function Hero() {
    return (
        <section className="relative h-[600px] w-full bg-muted flex items-center justify-center overflow-hidden">
            <div className="container px-4 text-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Welcome to Lama Ecommerce</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-[600px] mx-auto">
                    Discover our premium collection of products curated just for you.
                    (Dynamic Carousel Coming Soon)
                </p>
                <div className="mt-8 flex gap-4 justify-center">
                    <Button size="lg" className="px-6 py-3">Shop Now</Button>
                    <Button size="lg" variant="secondary" className="px-6 py-3">View Collections</Button>
                </div>
            </div>
        </section>
    );
}
