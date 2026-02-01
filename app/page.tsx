import { Hero } from "@/components/(storefront)/Home/Hero";
import { FeaturedProducts } from "@/components/(storefront)/Home/FeaturedProducts";
import { CategoryShowcase } from "@/components/(storefront)/Home/CategoryShowcase";
import { PromotionalBanners } from "@/components/(storefront)/Home/PromotionalBanners";

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
