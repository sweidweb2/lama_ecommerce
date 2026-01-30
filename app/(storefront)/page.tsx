import { Hero } from "@/components/Home/Hero";
import { FeaturedProducts } from "@/components/Home/FeaturedProducts";
import { CategoryShowcase } from "@/components/Home/CategoryShowcase";
import { PromotionalBanners } from "@/components/Home/PromotionalBanners";

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
