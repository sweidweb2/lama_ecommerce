/**
 * Seed dummy Aviora Wear t-shirt products from public/t-shirts/*.jpg.
 *
 * Inserts: brand (Aviora Wear), fashion category lookup, products,
 * size/color variants, and product_images pointing at /t-shirts/{n}.jpg.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * (loaded from .env.local via --env-file).
 *
 * Usage:
 *   npm run seed:products
 *
 * Re-run safe: skips products whose slug already exists.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readdirSync } from "node:fs";
import path from "node:path";
import type { Database } from "@/types/supabase";

type AdminClient = SupabaseClient<Database>;

const BRAND_NAME = "Aviora Wear";
const BRAND_SLUG = "aviora-wear";
const CATEGORY_SLUG = "fashion";
const SKU_PREFIX = "TEE-SEED";
const SIZES = ["S", "M", "L", "XL"] as const;
const MATERIALS = ["Cotton"] as const;

/** Curated display names for known image numbers; others get a generated label. */
const NAMED_TEES: Record<number, { name: string; color: string }> = {
  1: { name: "Dream Script Tee", color: "#EC4899" },
  2: { name: "Studio Soft Tee", color: "#F5F5DC" },
  3: { name: "City Walk Tee", color: "#000000" },
  4: { name: "Clean Crew Tee", color: "#FFFFFF" },
  5: { name: "Stripe Flag Tee", color: "#EF4444" },
  6: { name: "Lilac Boxy Tee", color: "#A855F7" },
  7: { name: "Heritage Logo Tee", color: "#6B7280" },
  8: { name: "Coral Classic Tee", color: "#F97316" },
  9: { name: "Night Block Tee", color: "#000000" },
  10: { name: "Sand Wash Tee", color: "#F5F5DC" },
  11: { name: "Everyday Crew Tee", color: "#FFFFFF" },
  12: { name: "Foals Graphic Tee", color: "#000000" },
  13: { name: "Motion Fit Tee", color: "#3B82F6" },
  14: { name: "Core Mark Tee", color: "#000000" },
  15: { name: "Osaka Dragon Tee", color: "#000000" },
  16: { name: "Right To Exist Tee", color: "#F59E0B" },
  17: { name: "Come Together Tee", color: "#000000" },
  18: { name: "Archive Print Tee", color: "#FFFFFF" },
  19: { name: "Mono Line Tee", color: "#6B7280" },
  20: { name: "Mountain Peak Tee", color: "#FFFFFF" },
  21: { name: "Coastal Soft Tee", color: "#06B6D4" },
  22: { name: "Ridgeline Tee", color: "#92400E" },
  23: { name: "Quiet Hour Tee", color: "#6B7280" },
  24: { name: "Field Day Tee", color: "#10B981" },
  25: { name: "Bonjour Heart Tee", color: "#FFFFFF" },
  26: { name: "Avenue Tee", color: "#000000" },
  27: { name: "Signal Tee", color: "#EF4444" },
  28: { name: "Harbor Tee", color: "#1E3A8A" },
  29: { name: "Pulse Tee", color: "#000000" },
  30: { name: "Explorer Peak Tee", color: "#800000" },
  31: { name: "Trail Mark Tee", color: "#92400E" },
  32: { name: "Night Run Tee", color: "#000000" },
  33: { name: "Soft Form Tee", color: "#FFFFFF" },
  34: { name: "Canvas Tee", color: "#F5F5DC" },
  35: { name: "Sunset Ridge Tee", color: "#6B7280" },
  36: { name: "Training Split Tee", color: "#000000" },
  37: { name: "Urban Grid Tee", color: "#6B7280" },
  38: { name: "Pale Study Tee", color: "#FFFFFF" },
  39: { name: "Shadow Cut Tee", color: "#000000" },
  40: { name: "Logo Mark Tee", color: "#000000" },
  41: { name: "Calm Stripe Tee", color: "#3B82F6" },
  42: { name: "Forge Tee", color: "#92400E" },
  43: { name: "Late Shift Tee", color: "#000000" },
  44: { name: "Weekend Tee", color: "#FFFFFF" },
  45: { name: "North Soft Tee", color: "#6B7280" },
  46: { name: "Block Party Tee", color: "#EF4444" },
  47: { name: "Quiet Black Tee", color: "#000000" },
  48: { name: "Mist Tee", color: "#C0C0C0" },
  49: { name: "Line Draw Tee", color: "#FFFFFF" },
  50: { name: "Finale Tee", color: "#000000" },
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it in .env.local`);
  }
  return value;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function listTeeImageNumbers(): number[] {
  const dir = path.join(process.cwd(), "public", "t-shirts");
  return readdirSync(dir)
    .map((file) => {
      const match = /^(\d+)\.jpg$/i.exec(file);
      return match ? Number(match[1]) : null;
    })
    .filter((n): n is number => n != null)
    .sort((a, b) => a - b);
}

async function ensureBrand(supabase: AdminClient): Promise<string> {
  const { data: existing, error: selectError } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", BRAND_SLUG)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("brands")
    .insert({
      name: BRAND_NAME,
      slug: BRAND_SLUG,
      logo_image_url: null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function getFashionCategoryId(supabase: AdminClient): Promise<string | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", CATEGORY_SLUG)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const brandId = await ensureBrand(supabase);
  const categoryId = await getFashionCategoryId(supabase);
  if (!categoryId) {
    throw new Error(
      `Category slug "${CATEGORY_SLUG}" not found. Run DB migrations / category seeds first.`,
    );
  }

  const imageNumbers = listTeeImageNumbers();
  if (imageNumbers.length === 0) {
    throw new Error("No public/t-shirts/*.jpg files found.");
  }

  let created = 0;
  let skipped = 0;

  for (const n of imageNumbers) {
    const named = NAMED_TEES[n];
    const name = named?.name ?? `Aviora Tee ${n}`;
    const color = (named?.color ?? "#000000").toUpperCase();
    const slug = `${slugify(name)}-${n}`;
    const sku = `${SKU_PREFIX}-${String(n).padStart(3, "0")}`;
    const price = Number((24 + (n % 17) + (n % 3) * 0.5).toFixed(2));
    const isFeatured = n % 7 === 0;
    const isTrending = n % 5 === 0;

    const { data: existing, error: existingError } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      skipped += 1;
      continue;
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        name,
        description: `${name} from the Aviora Wear dummy catalog. Soft cotton feel with everyday fit.`,
        slug,
        brand_id: brandId,
        category_id: categoryId,
        sku,
        price,
        is_featured: isFeatured,
        is_trending: isTrending,
        is_active: true,
      })
      .select("id")
      .single();

    if (productError) {
      console.error(`Failed product ${slug}:`, productError.message);
      continue;
    }

    const variants = SIZES.map((size) => ({
      product_id: product.id,
      color,
      size,
      material: MATERIALS[0],
      quantity_stock: 8 + (n % 12),
      sku_variant: `${sku}-${color.replace("#", "")}-${size}`,
      price_override: null,
    }));

    const { error: variantError } = await supabase
      .from("customised_products")
      .insert(variants);

    if (variantError) {
      console.error(`Failed variants for ${slug}:`, variantError.message);
      await supabase.from("products").delete().eq("id", product.id);
      continue;
    }

    const { error: imageError } = await supabase.from("product_images").insert({
      product_id: product.id,
      url_image: `/t-shirts/${n}.jpg`,
      is_primary: true,
    });

    if (imageError) {
      console.error(`Failed image for ${slug}:`, imageError.message);
      await supabase.from("products").delete().eq("id", product.id);
      continue;
    }

    created += 1;
    console.log(`created ${slug} ($${price})`);
  }

  console.log(
    `\nDone. created=${created} skipped=${skipped} total_images=${imageNumbers.length}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
