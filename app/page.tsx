import { Hero } from "@/components/Home/Hero";
import { FeaturedProducts } from "@/components/Home/FeaturedProducts";
import { CategoryShowcase } from "@/components/Home/CategoryShowcase";
import { PromotionalBanners } from "@/components/Home/PromotionalBanners";

/**
 * Root page - home page for the storefront.
 * This is the same as app/(storefront)/page.tsx
 * but Next.js type system requires a root page.tsx
 */
export default function HomePage() {
  return (
    <div className="flex flex-col gap-0">
      <Hero />
      <PromotionalBanners />
      <CategoryShowcase />
      <FeaturedProducts />
    </div>
  );
}
