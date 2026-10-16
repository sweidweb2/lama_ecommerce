import Image from "next/image";
import Link from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { HOME_PROMISE_SECTION } from "@/lib/constants/home-marketing";
import { cn } from "@/lib/utils";

export function BrandPromise() {
  const section = HOME_PROMISE_SECTION;

  return (
    <section className="bg-secondary/40 py-14 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border/70">
          <div className="grid grid-cols-1 gap-px bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "p-6 sm:p-7 md:p-8",
                  item.emphasized
                    ? "bg-primary text-primary-foreground"
                    : "bg-background",
                )}
              >
                <div
                  className={cn(
                    "relative mb-5 h-16 w-16 overflow-hidden rounded-xl sm:h-[4.5rem] sm:w-[4.5rem]",
                    item.emphasized ? "bg-primary-foreground/10" : "bg-secondary/40",
                  )}
                >
                  <Image
                    src={item.illustration}
                    alt=""
                    fill
                    className="object-cover object-center"
                    sizes="72px"
                    aria-hidden
                  />
                </div>
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1 h-4 w-0.5 shrink-0 rounded-full",
                      item.emphasized
                        ? "bg-primary-foreground"
                        : "bg-border",
                    )}
                  />
                  <div className="min-w-0 space-y-2">
                    <h3
                      className={cn(
                        "text-base font-semibold",
                        item.emphasized
                          ? "text-primary-foreground"
                          : "text-foreground",
                      )}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        item.emphasized
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 md:mt-14 max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {section.eyebrow}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
            {section.title}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            {section.description}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href={section.href}>{section.cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
