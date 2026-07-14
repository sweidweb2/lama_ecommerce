import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)
}

/**
 * Storefront listing price: "From $X" when variant effective prices differ.
 * Falls back to base `price` when min/max columns are missing.
 */
export function formatListingPrice(product: {
  price: number
  min_effective_price?: number | null
  max_effective_price?: number | null
}): string {
  const min = Number(product.min_effective_price ?? product.price)
  const max = Number(product.max_effective_price ?? product.price)
  if (min !== max) {
    return `From ${formatPrice(min)}`
  }
  return formatPrice(min)
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/** Truncate display text with ellipsis; empty/null becomes "—". */
export function truncateText(
  text: string | null | undefined,
  maxLength: number,
): string {
  if (!text) return "—"
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}