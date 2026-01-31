import { Hero } from "@/components/(storefront)/Home/Hero";
import { FeaturedProducts } from "@/components/(storefront)/Home/FeaturedProducts";
import { CategoryShowcase } from "@/components/(storefront)/Home/CategoryShowcase";
import { PromotionalBanners } from "@/components/(storefront)/Home/PromotionalBanners";

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
