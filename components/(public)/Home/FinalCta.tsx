import Link from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { HOME_FINAL_CTA } from "@/lib/constants/home-marketing";

export function FinalCta() {
  const section = HOME_FINAL_CTA;

  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(30_27%_87%_/_0.18),_transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-[80%] -translate-x-1/2 rounded-full bg-secondary/15 blur-3xl"
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            {section.eyebrow}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance">
            {section.title}
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-primary-foreground/80">
            {section.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 bg-background text-foreground hover:bg-background/90"
            >
              <Link href={section.primaryHref}>{section.primaryCta}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full px-8 border-primary-foreground/35 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href={section.secondaryHref}>{section.secondaryCta}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
