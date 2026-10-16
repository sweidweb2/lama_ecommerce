import Image from "next/image";
import Link from "@/components/ui/link";
import { LayoutGrid } from "lucide-react";
import { HOME_BEST_SELLERS } from "@/lib/constants/home-marketing";

export function BestSelling() {
    return (
        <section className="bg-background py-12 md:py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="mb-8 md:mb-10 text-center text-2xl md:text-3xl font-bold uppercase tracking-tight text-foreground">
                    Our Best Selling
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
                    {HOME_BEST_SELLERS.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="group flex flex-col items-center rounded-2xl bg-muted p-3 md:p-4 transition-colors hover:bg-accent"
                        >
                            <div className="relative mb-3 aspect-square w-full overflow-hidden">
                                <Image
                                    src={item.image}
                                    alt={item.label}
                                    fill
                                    className="object-contain object-center drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 12vw"
                                />
                            </div>
                            <span className="text-center text-xs md:text-sm font-medium text-foreground">
                                {item.label}
                            </span>
                        </Link>
                    ))}

                    <Link
                        href="/products"
                        className="group flex flex-col items-center justify-center rounded-2xl bg-muted p-3 md:p-4 transition-colors hover:bg-accent"
                    >
                        <div className="mb-3 flex aspect-square w-full items-center justify-center">
                            <LayoutGrid className="h-10 w-10 text-muted-foreground transition-colors group-hover:text-foreground" />
                        </div>
                        <span className="text-center text-xs md:text-sm font-medium text-foreground">
                            Shop all
                        </span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
