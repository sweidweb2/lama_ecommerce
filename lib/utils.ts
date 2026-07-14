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