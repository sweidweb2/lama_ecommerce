import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import Link from "next/link";

const heroData = [
    {
        id: 1,
        title: "Summer Collection 2026",
        description: "Discover the hottest trends for the upcoming season. Lightweight fabrics, vibrant colors, and styles that define summer elegance.",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
        cta: "Shop Summer",
        href: "/products",
    },
    {
        id: 2,
        title: "Modern Tech Essentials",
        description: "Upgrade your lifestyle with our curated selection of cutting-edge gadgets and accessories designed for the modern professional.",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop",
        cta: "Shop Electronics",
        href: "/products",
    },
    {
        id: 3,
        title: "Premium Home Decor",
        description: "Transform your living space into a sanctuary. Explore our exclusive range of handcrafted furniture and decor items.",
        image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop",
        cta: "Discover Home",
        href: "/products",
    },
];

export function Hero() {
    return (
        <section className="relative w-full">
            <Carousel
                opts={{
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent>
                    {heroData.map((item) => (
                        <CarouselItem key={item.id} className="relative h-[600px] w-full">
                            {/* Background Image */}
                            <div className="absolute inset-0 h-full w-full">
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                    priority={item.id === 1}
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                            </div>

                            {/* Content */}
                            <div className="relative h-full container flex flex-col justify-center px-4 sm:px-6 lg:px-8">
                                <div className="max-w-xl text-white space-y-6">
                                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        {item.title}
                                    </h1>
                                    <p className="text-lg md:text-xl text-gray-200 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                                        {item.description}
                                    </p>
                                    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                                        <Button
                                            asChild
                                            size="sm"
                                            className="text-sm px-4 py-2 md:text-lg md:px-8 md:py-6 bg-white text-black hover:bg-gray-100 border-none"
                                        >
                                            <Link href={item.href}>
                                                {item.cta}
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="text-sm px-4 py-2 md:text-lg md:px-8 md:py-6 text-white border-white hover:bg-white/20 hover:text-white bg-transparent"
                                        >
                                            <Link href="/products">
                                                View Details
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="left-4 bg-black/30 border-none text-white hover:bg-black/50 hover:text-white" />
                <CarouselNext className="right-4 bg-black/30 border-none text-white hover:bg-black/50 hover:text-white" />
            </Carousel>
        </section>
    );
}
