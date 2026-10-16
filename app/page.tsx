import type { Metadata } from "next";
import { Hero } from "@/components/(public)/Home/Hero";
import { BestSelling } from "@/components/(public)/Home/BestSelling";
import { FeaturedProducts } from "@/components/(public)/Home/FeaturedProducts";
import { CollectionSpotlight } from "@/components/(public)/Home/CollectionSpotlight";
import { BrandPromise } from "@/components/(public)/Home/BrandPromise";
import { ClubMembership } from "@/components/(public)/Home/ClubMembership";
import { FinalCta } from "@/components/(public)/Home/FinalCta";

export const metadata: Metadata = {
  title: { absolute: "Aviora Wear" },
  description:
    "Shop modern fashion and essentials at Aviora Wear. Browse featured products, categories, and new arrivals.",
};

/**
 * Root page - home page for the storefront.
 */
export default async function HomePage() {
  return (
    <div className="flex flex-col gap-0">
      <Hero />
      <BestSelling />
      <FeaturedProducts />
      <CollectionSpotlight />
      <ClubMembership />
      <BrandPromise />
      <FinalCta />
    </div>
  );
}
