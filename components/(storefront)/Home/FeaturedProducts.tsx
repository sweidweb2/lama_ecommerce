import { Button } from "@/components/ui/button";

export function FeaturedProducts() {
    return (
        <section className="py-16 container mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold italic tracking-tight uppercase">Featured Products</h2>
                    <p className="text-muted-foreground mt-2">Our handpicked selection of top products.</p>
                </div>
                <Button variant="link" className="text-primary font-medium">View All</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="group relative rounded-xl border bg-card p-4 transition-all">
                        <div className="aspect-square rounded-lg bg-muted mb-4 overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground italic">Product Image {i}</div>
                        </div>
                        <h3 className="font-semibold text-lg">Product Name {i}</h3>
                        <p className="text-muted-foreground text-sm">Category</p>
                        <div className="mt-4 flex justify-between items-center">
                            <span className="font-bold text-xl">$129.99</span>
                            <Button size="icon" className="h-8 w-8 rounded-full">+</Button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
