import { Button } from "@/components/ui/button";
import Link from "@/components/ui/link";
import { HOME_PROMO_BANNERS } from "@/lib/constants/home-marketing";
import { cn } from "@/lib/utils";

export function PromotionalBanners() {
    return (
        <section className="py-16 container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {HOME_PROMO_BANNERS.map((banner) => {
                    const isPrimary = banner.tone === "primary";
                    return (
                        <div
                            key={banner.id}
                            className={cn(
                                "relative h-[300px] rounded-3xl overflow-hidden flex items-center p-8 md:p-12",
                                isPrimary
                                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                                    : "bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground",
                            )}
                        >
                            <div className="max-w-[300px] z-10">
                                <span
                                    className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                        isPrimary
                                            ? "bg-primary-foreground/20"
                                            : "bg-secondary-foreground/20",
                                    )}
                                >
                                    {banner.eyebrow}
                                </span>
                                <h3 className="text-3xl font-bold mt-4">{banner.title}</h3>
                                <p
                                    className={cn(
                                        "mt-2",
                                        isPrimary
                                            ? "text-primary-foreground/80"
                                            : "text-secondary-foreground/80",
                                    )}
                                >
                                    {banner.description}
                                </p>
                                <Button
                                    asChild
                                    className={cn(
                                        "mt-6 px-6 py-2 rounded-full font-bold transition-colors",
                                        isPrimary
                                            ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                                            : "bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90",
                                    )}
                                >
                                    <Link href={banner.href}>{banner.cta}</Link>
                                </Button>
                            </div>
                            <div
                                className={cn(
                                    "absolute right-[-20px] bottom-[-20px] w-64 h-64 rounded-full blur-3xl",
                                    isPrimary
                                        ? "bg-primary-foreground/10"
                                        : "bg-secondary-foreground/10",
                                )}
                            />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
