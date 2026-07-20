/**
 * Shared storefront / admin color labels keyed by uppercase hex.
 * DB stores uppercase hex; palette names are display / legacy aliases.
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

const NAME_TO_HEX = new Map(
  COLOR_PALETTE.map((c) => [c.name.toLowerCase(), c.hex.toUpperCase()]),
);

function addCaseVariants(set: Set<string>, value: string): void {
  set.add(value);
  set.add(value.toUpperCase());
  set.add(value.toLowerCase());
}

/**
 * Canonical storage form: uppercase hex for palette colors and `#…` values.
 * Known palette names map to hex; other values pass through trimmed.
 */
export function canonicalizeColorForStorage(color: string): string {
  const trimmed = color.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("#")) {
    return trimmed.toUpperCase();
  }
  return NAME_TO_HEX.get(trimmed.toLowerCase()) ?? trimmed;
}

/** Normalize a color value for URL / DB matching (uppercase hex when known). */
export function normalizeColorValue(color: string): string {
  return canonicalizeColorForStorage(color);
}

/**
 * Expand filter selections so `#EF4444` and legacy `"Red"` both match.
 * Includes case variants of the raw value, hex, and palette name aliases.
 */
export function expandColorFilterValues(values: string[]): string[] {
  const set = new Set<string>();
  for (const raw of values) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    addCaseVariants(set, trimmed);

    const hex = canonicalizeColorForStorage(trimmed);
    if (hex.startsWith("#")) {
      addCaseVariants(set, hex);
      const name = HEX_TO_NAME.get(hex);
      if (name) {
        addCaseVariants(set, name);
      }
    }
  }
  return [...set];
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
  const byName = NAME_TO_HEX.get(trimmed.toLowerCase());
  return byName ?? "#6B7280";
}
