import { Button } from "@/components/ui/button";

export function PromotionalBanners() {
    return (
        <section className="py-16 container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative h-[300px] rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 flex items-center p-8 md:p-12 text-primary-foreground">
                    <div className="max-w-[300px] z-10">
                        <span className="bg-primary-foreground/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Summer Sale</span>
                        <h3 className="text-3xl font-bold mt-4">Up to 50% Off Everything</h3>
                        <p className="mt-2 text-primary-foreground/80">Refresh your wardrobe with our latest collection.</p>
                        <Button className="mt-6 px-6 py-2 bg-primary-foreground text-primary rounded-full font-bold hover:bg-primary-foreground/90 transition-colors">
                            Shop Now
                        </Button>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
                </div>

                <div className="relative h-[300px] rounded-3xl overflow-hidden bg-gradient-to-br from-secondary to-secondary/80 flex items-center p-8 md:p-12 text-secondary-foreground">
                    <div className="max-w-[300px] z-10">
                        <span className="bg-secondary-foreground/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">New Arrivals</span>
                        <h3 className="text-3xl font-bold mt-4">Premium Tech Essentials</h3>
                        <p className="mt-2 text-secondary-foreground/80">Experience the future of electronics today.</p>
                        <Button className="mt-6 px-6 py-2 bg-secondary-foreground text-secondary rounded-full font-bold hover:bg-secondary-foreground/90 transition-colors">
                            Explore
                        </Button>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-secondary-foreground/10 rounded-full blur-3xl" />
                </div>
            </div>
        </section>
    );
}
