/**
 * Shared storefront / admin color labels keyed by uppercase hex.
 * Used for facet display only; DB stores exact hex values.
 */
export const COLOR_PALETTE: ReadonlyArray<{ name: string; hex: string }> = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#10B981" },
  { name: "Yellow", hex: "#F59E0B" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Brown", hex: "#92400E" },
  { name: "Orange", hex: "#F97316" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Maroon", hex: "#800000" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Lime", hex: "#84CC16" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Indigo", hex: "#4F46E5" },
  { name: "Violet", hex: "#A855F7" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Amber", hex: "#FBBF24" },
  { name: "Emerald", hex: "#059669" },
  { name: "Sky", hex: "#0EA5E9" },
  { name: "Slate", hex: "#64748B" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Gold", hex: "#FCD34D" },
  { name: "Silver", hex: "#C0C0C0" },
];

const HEX_TO_NAME = new Map(
  COLOR_PALETTE.map((c) => [c.hex.toUpperCase(), c.name]),
);

/** Normalize a color value for URL / DB matching (uppercase hex). */
export function normalizeColorValue(color: string): string {
  const trimmed = color.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("#")) {
    return trimmed.toUpperCase();
  }
  return trimmed;
}

/** Label for a stored color: known palette name, else the raw value. */
export function getColorLabel(color: string): string {
  const normalized = normalizeColorValue(color);
  if (normalized.startsWith("#")) {
    return HEX_TO_NAME.get(normalized) ?? normalized;
  }
  return color.trim();
}

/** CSS background for a stored color value. */
export function getColorSwatch(color: string): string {
  const trimmed = color.trim();
  if (trimmed.startsWith("#")) return trimmed;
  const byName = COLOR_PALETTE.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
  );
  return byName?.hex ?? "#6B7280";
}
