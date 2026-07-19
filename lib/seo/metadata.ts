import type { Metadata } from "next";
import type { ProductImage, ProductWithRelations } from "@/types/product";

export const SITE_NAME = "Aviora Wear";

const DESCRIPTION_MAX_LENGTH = 160;

/** Truncate plain text for meta descriptions (default ~160 chars). */
export function truncateDescription(
  text: string | null | undefined,
  maxLength = DESCRIPTION_MAX_LENGTH,
): string | undefined {
  if (!text) return undefined;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

/** Prefer primary image, then first image. */
export function getPrimaryProductImageUrl(
  images: ProductImage[] | undefined | null,
): string | undefined {
  if (!images?.length) return undefined;
  const primary = images.find((img) => img.is_primary);
  return primary?.url_image ?? images[0]?.url_image;
}

/** Build Next.js Metadata for a product detail page. */
export function productToMetadata(
  product: ProductWithRelations,
): Metadata {
  const description =
    truncateDescription(product.description) ??
    `Shop ${product.name} at ${SITE_NAME}.`;
  const imageUrl = getPrimaryProductImageUrl(product.images);
  const canonical = `/products/${product.slug}`;

  return {
    title: product.name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: product.name,
      description,
      url: canonical,
      type: "website",
      ...(imageUrl ? { images: [{ url: imageUrl, alt: product.name }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: product.name,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}
