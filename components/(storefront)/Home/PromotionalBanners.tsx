import { Button } from "@/components/ui/button";

export function PromotionalBanners() {
    return (
        <section className="py-10 md:py-16 container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="relative h-[220px] md:h-[300px] rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 flex items-center p-4 md:p-8 lg:p-12 text-primary-foreground">
                    <div className="max-w-[260px] md:max-w-[300px] z-10">
                        <span className="bg-primary-foreground/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Summer Sale</span>
                        <h3 className="text-2xl md:text-3xl font-bold mt-3">Up to 50% Off Everything</h3>
                        <p className="mt-2 text-xs md:text-sm text-primary-foreground/80">Refresh your wardrobe with our latest collection.</p>
                        <Button className="mt-4 md:mt-6 px-4 py-2 md:px-6 md:py-2 text-xs md:text-sm bg-primary-foreground text-primary rounded-full font-bold hover:bg-primary-foreground/90 transition-colors">
                            Shop Now
                        </Button>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
                </div>

                <div className="relative h-[220px] md:h-[300px] rounded-3xl overflow-hidden bg-gradient-to-br from-secondary to-secondary/80 flex items-center p-4 md:p-8 lg:p-12 text-secondary-foreground">
                    <div className="max-w-[260px] md:max-w-[300px] z-10">
                        <span className="bg-secondary-foreground/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">New Arrivals</span>
                        <h3 className="text-2xl md:text-3xl font-bold mt-3">Premium Tech Essentials</h3>
                        <p className="mt-2 text-xs md:text-sm text-secondary-foreground/80">Experience the future of electronics today.</p>
                        <Button className="mt-4 md:mt-6 px-4 py-2 md:px-6 md:py-2 text-xs md:text-sm bg-secondary-foreground text-secondary rounded-full font-bold hover:bg-secondary-foreground/90 transition-colors">
                            Explore
                        </Button>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-secondary-foreground/10 rounded-full blur-3xl" />
                </div>
            </div>
        </section>
    );
}
