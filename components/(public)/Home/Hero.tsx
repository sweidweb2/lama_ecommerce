import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "@/components/ui/link";
import { HOME_HERO_SLIDES } from "@/lib/constants/home-marketing";

const heroSlide = HOME_HERO_SLIDES[0];

export function Hero() {
    if (!heroSlide) {
        return null;
    }

    return (
        <section className="relative w-full overflow-hidden">
            <div className="relative h-[560px] md:h-[640px] w-full">
                <div className="absolute inset-0 h-full w-full overflow-hidden">
                    <Image
                        src={heroSlide.image}
                        alt={heroSlide.title}
                        fill
                        priority
                        className="object-cover object-right"
                        sizes="100vw"
                    />
                </div>

                <div className="relative z-10 h-full container flex flex-col justify-center pl-8 pr-4 sm:pl-12 sm:pr-6 md:pl-16 lg:pl-20 xl:pl-24">
                    <div className="max-w-xl space-y-6 text-foreground">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                            {heroSlide.title}
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground">
                            {heroSlide.description}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Button asChild size="lg" className="text-lg px-8 py-6">
                                <Link href={heroSlide.href}>{heroSlide.cta}</Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="text-lg px-8 py-6 bg-background/70 backdrop-blur-sm"
                            >
                                <Link href="/products">Browse catalog</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
