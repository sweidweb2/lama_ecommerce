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
    image: "/hero-section/hero-1.png",
    cta: "Shop all products",
    href: "/products",
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

export interface HomeBestSeller {
  id: string;
  label: string;
  image: string;
  href: string;
}

/** Transparent cutouts from /public/images/without bg. */
export const HOME_BEST_SELLERS: readonly HomeBestSeller[] = [
  {
    id: "stripe-pocket",
    label: "Stripe Pocket",
    image: "/images/without bg/34-removebg-preview.png",
    href: "/products?category=fashion",
  },
  {
    id: "mountain",
    label: "Mountain",
    image: "/images/without bg/39-removebg-preview.png",
    href: "/products?category=fashion",
  },
  {
    id: "provence",
    label: "Provence",
    image: "/images/without bg/41-removebg-preview.png",
    href: "/products?category=fashion",
  },
  {
    id: "desert-springs",
    label: "Desert Springs",
    image: "/images/without bg/42-removebg-preview.png",
    href: "/products?category=fashion",
  },
  {
    id: "script",
    label: "Script",
    image: "/images/without bg/43-removebg-preview.png",
    href: "/products?category=fashion",
  },
  {
    id: "lilac-knit",
    label: "Lilac Knit",
    image: "/images/without bg/44-removebg-preview.png",
    href: "/products?category=fashion",
  },
  {
    id: "originals",
    label: "Originals",
    image: "/images/without bg/72-removebg-preview.png",
    href: "/products?category=fashion",
  },
] as const;

export interface HomeCollectionCard {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
}

/** Cropped panels from public/home/grid-cards */
export const HOME_COLLECTION_CARDS: readonly HomeCollectionCard[] = [
  {
    id: "layers",
    title: "Layers",
    description: "Soft hoodies and everyday knits in warm neutrals.",
    image: "/home/grid-cards/earth-tone-1.png",
    href: "/products?category=fashion",
  },
  {
    id: "essentials",
    title: "Essentials",
    description: "Bags, bottles, and small pieces for daily carry.",
    image: "/home/grid-cards/earth-tone-2.png",
    href: "/products",
  },
  {
    id: "basics",
    title: "Basics",
    description: "Clean tees and caps that sit at the core of the wardrobe.",
    image: "/home/grid-cards/earth-tone-3.png",
    href: "/products?category=fashion",
  },
  {
    id: "bottoms",
    title: "Bottoms",
    description: "Denim, chinos, and relaxed fits in earth tones.",
    image: "/home/grid-cards/earth-tone-4.png",
    href: "/products?category=fashion",
  },
] as const;

export interface HomeFeaturedProduct {
  id: string;
  name: string;
  image: string;
  href: string;
  price: number;
  compareAtPrice?: number;
  badge?: "Sale" | "New";
  rating: number;
  reviewCount: number;
}

/** Editorial featured row for the homepage (t-shirt dummy picks). */
export const HOME_FEATURED_PRODUCTS: readonly HomeFeaturedProduct[] = [
  {
    id: "feat-1",
    name: "Coral Classic Tee",
    image: "/t-shirts/8.jpg",
    href: "/products/coral-classic-tee-8",
    price: 33,
    compareAtPrice: 45,
    badge: "Sale",
    rating: 4.5,
    reviewCount: 128,
  },
  {
    id: "feat-2",
    name: "Osaka Dragon Tee",
    image: "/t-shirts/15.jpg",
    href: "/products/osaka-dragon-tee-15",
    price: 39,
    rating: 4.5,
    reviewCount: 96,
  },
  {
    id: "feat-3",
    name: "Mountain Peak Tee",
    image: "/t-shirts/20.jpg",
    href: "/products/mountain-peak-tee-20",
    price: 34.5,
    badge: "New",
    rating: 4,
    reviewCount: 64,
  },
  {
    id: "feat-4",
    name: "Bonjour Heart Tee",
    image: "/t-shirts/25.jpg",
    href: "/products/bonjour-heart-tee-25",
    price: 32.5,
    rating: 4.5,
    reviewCount: 82,
  },
  {
    id: "feat-5",
    name: "Explorer Peak Tee",
    image: "/t-shirts/30.jpg",
    href: "/products/explorer-peak-tee-30",
    price: 37,
    compareAtPrice: 49,
    badge: "Sale",
    rating: 4.5,
    reviewCount: 45,
  },
  {
    id: "feat-6",
    name: "Dream Script Tee",
    image: "/t-shirts/1.jpg",
    href: "/products/dream-script-tee-1",
    price: 25.5,
    badge: "New",
    rating: 4.5,
    reviewCount: 71,
  },
  {
    id: "feat-7",
    name: "Stripe Flag Tee",
    image: "/t-shirts/5.jpg",
    href: "/products/stripe-flag-tee-5",
    price: 30,
    compareAtPrice: 42,
    badge: "Sale",
    rating: 4,
    reviewCount: 58,
  },
  {
    id: "feat-8",
    name: "Sunset Ridge Tee",
    image: "/t-shirts/35.jpg",
    href: "/products/sunset-ridge-tee-35",
    price: 26,
    rating: 4.5,
    reviewCount: 39,
  },
  {
    id: "feat-9",
    name: "Core Mark Tee",
    image: "/t-shirts/14.jpg",
    href: "/products/core-mark-tee-14",
    price: 39,
    rating: 4.5,
    reviewCount: 112,
  },
  {
    id: "feat-10",
    name: "Logo Mark Tee",
    image: "/t-shirts/40.jpg",
    href: "/products/logo-mark-tee-40",
    price: 30.5,
    compareAtPrice: 38,
    badge: "Sale",
    rating: 4,
    reviewCount: 54,
  },
] as const;

export interface HomeClubMembership {
  image: string;
  alt: string;
  href: string;
}

export const HOME_CLUB_MEMBERSHIP: HomeClubMembership = {
  image: "/home/Aviora Club Membership Banner.jpg",
  alt: "Join the Aviora Club — discover timeless essentials and member-only offers",
  href: "/account",
};

export type HomePromiseIcon =
  | "materials"
  | "fit"
  | "shipping"
  | "care"
  | "styling"
  | "club";

export interface HomePromiseItem {
  id: string;
  icon: HomePromiseIcon;
  /** Isometric illustration under public/home/promise-icons */
  illustration: string;
  title: string;
  description: string;
  emphasized?: boolean;
}

export interface HomePromiseSection {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  items: readonly HomePromiseItem[];
}

/** Values / promise grid under the collection cards. */
export const HOME_PROMISE_SECTION: HomePromiseSection = {
  eyebrow: "The Aviora way",
  title: "The right piece can change how your wardrobe works.",
  description:
    "From fabric to fit to delivery, every detail is built to keep everyday dressing simple, calm, and lasting.",
  cta: "Shop the catalog",
  href: "/products",
  items: [
    {
      id: "materials",
      icon: "materials",
      illustration: "/home/promise-icons/materials.jpg",
      title: "Materials",
      description:
        "Soft cottons and earth-tone fabrics chosen for comfort, washability, and everyday wear.",
    },
    {
      id: "fit",
      icon: "fit",
      illustration: "/home/promise-icons/fit.jpg",
      title: "Fit",
      description:
        "Clean cuts and reliable sizing so your favorites feel right from the first wear.",
    },
    {
      id: "shipping",
      icon: "shipping",
      illustration: "/home/promise-icons/shipping.jpg",
      title: "Shipping",
      description:
        "Straightforward delivery options with clear timelines once your order is confirmed.",
    },
    {
      id: "care",
      icon: "care",
      illustration: "/home/promise-icons/care.jpg",
      title: "Care",
      description:
        "Pieces made to hold up through regular washes without losing their shape or feel.",
    },
    {
      id: "styling",
      icon: "styling",
      illustration: "/home/promise-icons/styling.jpg",
      title: "Styling",
      description:
        "Neutrals and essentials that mix easily — build looks without overthinking the closet.",
    },
    {
      id: "club",
      icon: "club",
      illustration: "/home/promise-icons/club.jpg",
      title: "Aviora Club",
      description:
        "Member updates, early drops, and curated picks for people who live in the wardrobe.",
      emphasized: true,
    },
  ],
};

export interface HomeFinalCta {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
}

/** Closing call-to-action band at the bottom of the homepage. */
export const HOME_FINAL_CTA: HomeFinalCta = {
  eyebrow: "Aviora Wear",
  title: "Ready for pieces that earn their place?",
  description:
    "Browse the catalog for everyday essentials — calm colors, reliable fit, and wardrobe staples made to last.",
  primaryCta: "Shop all products",
  primaryHref: "/products",
  secondaryCta: "Join Aviora Club",
  secondaryHref: "/account",
};

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
