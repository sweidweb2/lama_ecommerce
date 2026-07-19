/**
 * Editorial/static homepage hero slides (not CMS-backed).
 * CTAs point at real storefront routes / category filters.
 */
export interface HomeHeroSlide {
  id: number;
  title: string;
  description: string;
  image: string;
  cta: string;
  href: string;
}

export const HOME_HERO_SLIDES: readonly HomeHeroSlide[] = [
  {
    id: 1,
    title: "Shop the catalog",
    description:
      "Browse active products across fashion, electronics, home, and more — filtered and sorted to help you find what you need.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
    cta: "Shop all products",
    href: "/products",
  },
  {
    id: 2,
    title: "Electronics",
    description:
      "Explore gadgets and accessories in our electronics category.",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop",
    cta: "Shop electronics",
    href: "/products?category=electronics",
  },
  {
    id: 3,
    title: "Home & garden",
    description:
      "Furniture and decor from the home & garden category.",
    image:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop",
    cta: "Shop home",
    href: "/products?category=home-garden",
  },
] as const;

export interface HomePromoBanner {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  tone: "primary" | "secondary";
}

/** Editorial promo tiles — no live discount claims. */
export const HOME_PROMO_BANNERS: readonly HomePromoBanner[] = [
  {
    id: "catalog",
    eyebrow: "Catalog",
    title: "Shop the full catalog",
    description: "Browse every active product with filters for category, price, color, and size.",
    cta: "Shop now",
    href: "/products",
    tone: "primary",
  },
  {
    id: "fashion",
    eyebrow: "Category",
    title: "Fashion picks",
    description: "Jump straight into the fashion category.",
    cta: "Explore fashion",
    href: "/products?category=fashion",
    tone: "secondary",
  },
] as const;
