import Image from "next/image";
import Link from "@/components/ui/link";
import { ArrowRight } from "lucide-react";
import { HOME_COLLECTION_CARDS } from "@/lib/constants/home-marketing";

export function CollectionSpotlight() {
    return (
        <section className="bg-background py-10 md:py-14">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {HOME_COLLECTION_CARDS.map((card) => (
                        <Link
                            key={card.id}
                            href={card.href}
                            className="group relative block min-h-[200px] md:min-h-[240px] overflow-hidden rounded-2xl"
                        >
                            <Image
                                src={card.image}
                                alt={card.title}
                                fill
                                className="object-cover object-center scale-110 transition-transform duration-500 group-hover:scale-[1.15]"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />

                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-[75%] bg-gradient-to-r from-background/95 from-35% via-background/65 via-65% to-transparent"
                            />

                            <div className="absolute inset-y-0 left-16 z-10 flex w-[min(48%,260px)] flex-col justify-center gap-2 sm:left-20 md:left-24">
                                <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground">
                                    {card.title}
                                </h3>
                                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                                    {card.description}
                                </p>
                                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                                    View
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
