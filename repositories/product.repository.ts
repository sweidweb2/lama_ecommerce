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
}

const PRODUCT_SELECT =
  "*, brand:brands(*), category:categories(*), images:product_images(*), variants:product_variants(*)";

export interface CreateProductRepoInput {
  name: string;
  description: string | null;
  slug: string | null;
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
  slug?: string | null;
  brand_id?: string | null;
  category_id?: string | null;
  sku?: string | null;
  price?: number;
  is_featured?: boolean;
  is_trending?: boolean;
  is_active?: boolean;
}

/**
 * Fetch all products for admin (no `is_active` filter), including images.
 */
export async function getAdminProducts(): Promise<ProductWithRelations[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();

    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*)")
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
  const { categoryId, sort, page = 1, pageSize = 12, search } = params;

  try {
    const supabase = await createSupabaseServerComponentClient();
    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT, { count: "exact" })
      .eq("is_active", true);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (sort) {
      const [field, order] = sort.split("-");
      query = query.order(field, { ascending: order === "asc" });
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
 * Create a new product (admin-only, called from server actions).
 */
export async function createProduct(
  input: CreateProductRepoInput,
): Promise<Product | null> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: input.name,
          description: input.description ?? undefined,
          slug: input.slug ?? undefined,
          brand_id: input.brand_id ?? undefined,
          category_id: input.category_id ?? undefined,
          sku: input.sku ?? undefined,
          price: input.price,
          is_featured: input.is_featured ?? false,
          is_trending: input.is_trending ?? false,
          is_active: input.is_active ?? true,
          owner_id: input.owner_id,
        },
      ] as any)
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
      .update([patch] as any)
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
