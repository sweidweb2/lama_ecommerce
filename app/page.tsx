import type { Metadata } from "next";
import { Hero } from "@/components/(public)/Home/Hero";
import { FeaturedProducts } from "@/components/(public)/Home/FeaturedProducts";
import { CategoryShowcase } from "@/components/(public)/Home/CategoryShowcase";
import { PromotionalBanners } from "@/components/(public)/Home/PromotionalBanners";
import { getHomeCategoriesService } from "@/services/categories.service";

export const metadata: Metadata = {
  title: { absolute: "Aviora Wear" },
  description:
    "Shop modern fashion and essentials at Aviora Wear. Browse featured products, categories, and new arrivals.",
};

/**
 * Root page - home page for the storefront.
 */
export default async function HomePage() {
  const categories = await getHomeCategoriesService();

  return (
    <div className="flex flex-col gap-0">
      <Hero />
      <PromotionalBanners />
      <CategoryShowcase categories={categories} />
      <FeaturedProducts />
    </div>
  );
}
