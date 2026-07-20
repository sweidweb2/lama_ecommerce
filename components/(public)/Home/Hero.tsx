"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import Link from "@/components/ui/link";
import { HOME_HERO_SLIDES } from "@/lib/constants/home-marketing";

export function Hero() {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const imageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    useEffect(() => {
        if (!api) {
            return;
        }

        const onSelect = () => {
            setCurrent(api.selectedScrollSnap());
        };

        // Defer initial sync so setState is not synchronous inside the effect.
        queueMicrotask(onSelect);
        api.on("select", onSelect);

        return () => {
            api.off("select", onSelect);
        };
    }, [api]);

    // Trigger zoom animation when slide changes
    useEffect(() => {
        Object.values(imageRefs.current).forEach((ref) => {
            if (ref) {
                ref.classList.remove("hero-zoom-animate");
            }
        });

        const timeoutId = setTimeout(() => {
            const currentImageRef = imageRefs.current[current];
            if (currentImageRef) {
                void currentImageRef.offsetWidth;
                currentImageRef.classList.add("hero-zoom-animate");
            }
        }, 50);

        return () => clearTimeout(timeoutId);
    }, [current]);

    return (
        <section className="relative w-full">
            <Carousel
                setApi={setApi}
                opts={{
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent>
                    {HOME_HERO_SLIDES.map((item, index) => (
                        <CarouselItem key={item.id} className="relative h-[600px] w-full">
                            <div
                                ref={(el) => {
                                    imageRefs.current[index] = el;
                                }}
                                className="absolute inset-0 h-full w-full overflow-hidden"
                            >
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                    priority={item.id === 1}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent z-10" />
                            </div>

                            <div className="relative h-full container flex flex-col justify-center px-4 sm:px-6 lg:px-8">
                                <div className="max-w-xl text-white space-y-6">
                                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        {item.title}
                                    </h1>
                                    <p className="text-lg md:text-xl text-gray-200 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                                        {item.description}
                                    </p>
                                    <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                                        <Button asChild size="lg" className="text-lg px-8 py-6 bg-white text-black hover:bg-gray-100 border-none">
                                            <Link href={item.href}>
                                                {item.cta}
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size="lg"
                                            variant="outline"
                                            className="text-lg px-8 py-6 text-white border-white hover:bg-white/20 hover:text-white bg-transparent"
                                        >
                                            <Link href="/products">
                                                Browse catalog
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
