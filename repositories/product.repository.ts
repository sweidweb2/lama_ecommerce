import {
  createSupabaseServerActionClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/server";
import type { Product, ProductWithRelations } from "@/types/product";

export interface GetProductsRepoParams {
  categoryId?: string | null;
  sort?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  excludeId?: string;
  brandId?: string | null;
  isFeatured?: boolean;
  isTrending?: boolean;
  colors?: string[];
  sizes?: string[];
}

export interface ProductVariantFacets {
  colors: string[];
  sizes: string[];
}

// Common select used for product detail / listing where we only need
// the core product data plus brand, category, images, and public stats.
const PRODUCT_SELECT =
  "*, brand:brands(*), category:categories(*), images:product_images(*), stats:product_stats(*)";

function expandCaseVariants(values: string[]): string[] {
  const set = new Set<string>();
  for (const raw of values) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    set.add(trimmed);
    set.add(trimmed.toUpperCase());
    set.add(trimmed.toLowerCase());
  }
  return [...set];
}

export interface CreateProductRepoInput {
  name: string;
  description: string | null;
  slug: string;
  brand_id: string | null;
  category_id: string | null;
  sku: string | null;
  price: number;
  is_featured?: boolean;
  is_trending?: boolean;
  is_active?: boolean;
  owner_id: string;
}

export interface UpdateProductRepoInput {
  name?: string;
  description?: string | null;
  slug?: string;
  brand_id?: string | null;
  category_id?: string | null;
  sku?: string | null;
  price?: number;
  is_featured?: boolean;
  is_trending?: boolean;
  is_active?: boolean;
}

/**
 * Fetch all products for admin (no `is_active` filter), including images and relations.
 */
export async function getAdminProducts(): Promise<ProductWithRelations[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();

    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin products:", error);
      return [];
    }

    return (data ?? []) as ProductWithRelations[];
  } catch (error) {
    console.error("Unexpected error in getAdminProducts:", error);
    return [];
  }
}

/**
 * Fetch products with filters, sorting, and pagination.
 */
export async function getProducts(
  params: GetProductsRepoParams = {},
): Promise<{ data: ProductWithRelations[]; count: number }> {
  const {
    categoryId,
    sort,
    page = 1,
    pageSize: rawPageSize = 12,
    search,
    minPrice,
    maxPrice,
    excludeId,
    brandId,
    isFeatured,
    isTrending,
    colors,
    sizes,
  } = params;

  const pageSize = Math.min(Math.max(1, rawPageSize), 48);
  const hasColorFilter = (colors?.length ?? 0) > 0;
  const hasSizeFilter = (sizes?.length ?? 0) > 0;

  try {
    const supabase = await createSupabaseServerComponentClient();

    let matchingProductIds: string[] | null = null;
    if (hasColorFilter || hasSizeFilter) {
      let variantQuery = supabase
        .from("customised_products")
        .select("product_id");

      if (hasColorFilter) {
        variantQuery = variantQuery.in(
          "color",
          expandCaseVariants(colors!),
        );
      }
      if (hasSizeFilter) {
        variantQuery = variantQuery.in(
          "size",
          expandCaseVariants(sizes!),
        );
      }

      const { data: variantRows, error: variantError } = await variantQuery;
      if (variantError) {
        console.error("Error filtering products by variants:", variantError);
        return { data: [], count: 0 };
      }

      matchingProductIds = [
        ...new Set(
          (variantRows ?? [])
            .map((row) => (row as { product_id: string }).product_id)
            .filter(Boolean),
        ),
      ];

      if (matchingProductIds.length === 0) {
        return { data: [], count: 0 };
      }
    }

    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT, { count: "exact" })
      .eq("is_active", true);

    if (matchingProductIds) {
      query = query.in("id", matchingProductIds);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (brandId) {
      query = query.eq("brand_id", brandId);
    }

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    if (isFeatured === true) {
      query = query.eq("is_featured", true);
    }

    if (isTrending === true) {
      query = query.eq("is_trending", true);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // Range overlap with variant-aware [min_effective_price, max_effective_price]
    if (minPrice !== undefined && !Number.isNaN(minPrice)) {
      query = query.gte("max_effective_price", minPrice);
    }

    if (maxPrice !== undefined && !Number.isNaN(maxPrice)) {
      query = query.lte("min_effective_price", maxPrice);
    }

    if (sort) {
      const [field, order] = sort.split("-");
      // Only allow known sortable columns; price → min_effective_price
      const column =
        field === "price"
          ? "min_effective_price"
          : field === "created_at" || field === "name"
            ? field
            : null;
      if (column) {
        query = query.order(column, { ascending: order === "asc" });
      } else {
        query = query.order("created_at", { ascending: false });
      }
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { data: [], count: 0 };
    }

    return {
      data: (data ?? []) as ProductWithRelations[],
      count: count ?? 0,
    };
  } catch {
    return { data: [], count: 0 };
  }
}

/**
 * Distinct color / size values from variants of active products (storefront facets).
 */
export async function getProductVariantFacets(): Promise<ProductVariantFacets> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    // Public RLS already limits reads to variants of active products.
    const { data, error } = await supabase
      .from("customised_products")
      .select("color, size");

    if (error) {
      console.error("Error fetching variant facets:", error);
      return { colors: [], sizes: [] };
    }

    const colorSet = new Map<string, string>();
    const sizeSet = new Map<string, string>();

    for (const row of data ?? []) {
      const color = (row as { color: string | null }).color?.trim();
      if (color) {
        const key = color.toUpperCase();
        if (!colorSet.has(key)) colorSet.set(key, color);
      }
      const size = (row as { size: string | null }).size?.trim();
      if (size) {
        const key = size.toUpperCase();
        if (!sizeSet.has(key)) sizeSet.set(key, size);
      }
    }

    return {
      colors: [...colorSet.values()].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      ),
      sizes: [...sizeSet.values()].sort((a, b) =>
        a.localeCompare(b, undefined, {
          sensitivity: "base",
          numeric: true,
        }),
      ),
    };
  } catch (error) {
    console.error("Unexpected error in getProductVariantFacets:", error);
    return { colors: [], sizes: [] };
  }
}

/**
 * Min/max active product effective prices for the storefront price slider.
 */
export async function getProductPriceBounds(): Promise<{
  minPrice: number;
  maxPrice: number;
}> {
  try {
    const supabase = await createSupabaseServerComponentClient();

    const [{ data: minRow }, { data: maxRow }] = await Promise.all([
      supabase
        .from("products")
        .select("min_effective_price")
        .eq("is_active", true)
        .order("min_effective_price", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("products")
        .select("max_effective_price")
        .eq("is_active", true)
        .order("max_effective_price", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const minPrice =
      minRow?.min_effective_price != null
        ? Math.floor(Number(minRow.min_effective_price))
        : 0;
    const maxPrice =
      maxRow?.max_effective_price != null
        ? Math.ceil(Number(maxRow.max_effective_price))
        : 1000;

    return {
      minPrice,
      maxPrice: Math.max(maxPrice, minPrice),
    };
  } catch {
    return { minPrice: 0, maxPrice: 1000 };
  }
}

/**
 * Related products via tiered bounded queries (no full-catalog fetch).
 */
export async function getRelatedProducts(
  product: {
    id: string;
    brand_id: string | null;
    category_id: string | null;
  },
  limit = 12,
): Promise<ProductWithRelations[]> {
  const results: ProductWithRelations[] = [];
  const usedIds = new Set<string>([product.id]);

  const append = (rows: ProductWithRelations[]) => {
    for (const row of rows) {
      if (usedIds.has(row.id)) continue;
      usedIds.add(row.id);
      results.push(row);
      if (results.length >= limit) return;
    }
  };

  const remaining = () => limit - results.length;

  if (product.brand_id && product.category_id && remaining() > 0) {
    const { data } = await getProducts({
      brandId: product.brand_id,
      categoryId: product.category_id,
      excludeId: product.id,
      page: 1,
      pageSize: remaining(),
      sort: "created_at-desc",
    });
    append(data);
  }

  if (product.brand_id && remaining() > 0) {
    const { data } = await getProducts({
      brandId: product.brand_id,
      excludeId: product.id,
      page: 1,
      pageSize: remaining(),
      sort: "created_at-desc",
    });
    append(data);
  }

  if (product.category_id && remaining() > 0) {
    const { data } = await getProducts({
      categoryId: product.category_id,
      excludeId: product.id,
      page: 1,
      pageSize: remaining(),
      sort: "created_at-desc",
    });
    append(data);
  }

  if (remaining() > 0) {
    const { data } = await getProducts({
      excludeId: product.id,
      page: 1,
      pageSize: remaining(),
      sort: "created_at-desc",
    });
    append(data);
  }

  return results;
}

/**
 * Fetch a single product by slug with relations.
 */
export async function getProductBySlug(
  slug: string,
): Promise<ProductWithRelations | null> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching product by slug:", error);
      return null;
    }

    return data as ProductWithRelations;
  } catch (error) {
    console.error("Unexpected error in getProductBySlug:", error);
    return null;
  }
}

/**
 * Fetch a single product by id with relations.
 */
export async function getProductById(
  id: string,
): Promise<ProductWithRelations | null> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching product by id:", error);
      return null;
    }

    return data as ProductWithRelations;
  } catch (error) {
    console.error("Unexpected error in getProductById:", error);
    return null;
  }
}

/**
 * Create a new product (admin-only, called from server actions).
 */
export async function createProduct(
  input: CreateProductRepoInput,
): Promise<Product | null> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: input.name,
        description: input.description ?? undefined,
        slug: input.slug,
        brand_id: input.brand_id ?? undefined,
        category_id: input.category_id ?? undefined,
        sku: input.sku ?? undefined,
        price: input.price,
        is_featured: input.is_featured ?? false,
        is_trending: input.is_trending ?? false,
        is_active: input.is_active ?? true,
        owner_id: input.owner_id,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return null;
    }

    return (data ?? null) as Product | null;
  } catch (error) {
    console.error("Unexpected error in createProduct:", error);
    return null;
  }
}

/**
 * Update an existing product by id (admin-only, called from services).
 */
export async function updateProduct(
  id: string,
  input: UpdateProductRepoInput,
): Promise<Product | null> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const patch: Partial<Product> = {};

    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.brand_id !== undefined) patch.brand_id = input.brand_id;
    if (input.category_id !== undefined) patch.category_id = input.category_id;
    if (input.sku !== undefined) patch.sku = input.sku;
    if (input.price !== undefined) patch.price = input.price;
    if (input.is_featured !== undefined)
      patch.is_featured = input.is_featured;
    if (input.is_trending !== undefined)
      patch.is_trending = input.is_trending;
    if (input.is_active !== undefined) patch.is_active = input.is_active;

    if (Object.keys(patch).length === 0) {
      return null;
    }

    const { data, error } = await supabase
      .from("products")
      .update([patch] as never)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return null;
    }

    return (data ?? null) as Product | null;
  } catch (error) {
    console.error("Unexpected error in updateProduct:", error);
    return null;
  }
}

/**
 * Hard-delete a product.
 * Blocks when NO ACTION children exist: product_questions, product_views, product_stats,
 * or wishlists/cart_items referencing the product's variants.
 * Images, variants, and reviews cascade via FK.
 */
export async function hardDeleteProduct(id: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const blockingChecks: Array<{
      table: "product_questions" | "product_views" | "product_stats";
      label: string;
    }> = [
      { table: "product_questions", label: "product questions" },
      { table: "product_views", label: "product views" },
      { table: "product_stats", label: "product stats" },
    ];

    for (const { table, label } of blockingChecks) {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("product_id", id);

      if (error) {
        console.error(`Error checking ${table} before product delete:`, error);
        return false;
      }
      if ((count ?? 0) > 0) {
        throw new Error(
          `Cannot delete product: ${label} still exist. Remove them first.`,
        );
      }
    }

    const { data: variants, error: variantsError } = await supabase
      .from("customised_products")
      .select("id")
      .eq("product_id", id);

    if (variantsError) {
      console.error("Error fetching variants before product delete:", variantsError);
      return false;
    }

    const variantIds = ((variants ?? []) as { id: string }[]).map((v) => v.id);

    if (variantIds.length > 0) {
      const { count: wishlistCount, error: wishlistError } = await supabase
        .from("wishlists")
        .select("*", { count: "exact", head: true })
        .in("customised_product_id", variantIds);

      if (wishlistError) {
        console.error("Error checking wishlists before product delete:", wishlistError);
        return false;
      }
      if ((wishlistCount ?? 0) > 0) {
        throw new Error(
          "Cannot delete product: wishlist items still reference its variants. Remove them first.",
        );
      }

      const { count: cartItemCount, error: cartItemError } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .in("customised_product_id", variantIds);

      if (cartItemError) {
        console.error("Error checking cart_items before product delete:", cartItemError);
        return false;
      }
      if ((cartItemCount ?? 0) > 0) {
        throw new Error(
          "Cannot delete product: cart items still reference its variants. Remove them first.",
        );
      }

      const { count: orderItemCount, error: orderItemError } = await supabase
        .from("order_items")
        .select("*", { count: "exact", head: true })
        .in("customised_product_id", variantIds);

      if (orderItemError) {
        console.error("Error checking order_items before product delete:", orderItemError);
        return false;
      }
      if ((orderItemCount ?? 0) > 0) {
        throw new Error(
          "Cannot delete product: order history still references its variants.",
        );
      }
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        throw new Error(
          "Cannot delete product: related records still exist. Remove them first.",
        );
      }
      console.error("Error hard-deleting product:", error);
      return false;
    }

    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Cannot delete product:")
    ) {
      throw error;
    }
    console.error("Unexpected error in hardDeleteProduct:", error);
    return false;
  }
}
