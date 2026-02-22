import {
  createSupabaseServerActionClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Product, ProductWithRelations } from "@/types/product";

export interface GetProductsRepoParams {
  categoryId?: string | null;
  sort?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

// Common select used for product detail / listing where we only need
// the core product data plus brand, category, and images.
// (Variants are currently handled as dummy data in the admin UI.)
const PRODUCT_SELECT =
  "*, brand:brands(*), category:categories(*), images:product_images(*)";

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
 * Check whether any rows in related tables reference this product.
 *
 * If true, we should hard-delete (cascade) instead of soft-deleting.
 */
export async function hasProductRelations(productId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const relatedChecks: Array<{ table: string; column: string }> = [
      { table: "product_images", column: "product_id" },
      { table: "customised_products", column: "product_id" },
      { table: "reviews", column: "product_id" },
      { table: "product_questions", column: "product_id" },
      { table: "product_views", column: "product_id" },
      { table: "product_stats", column: "product_id" },
    ];

    for (const { table, column } of relatedChecks) {
      const { count, error } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq(column, productId);

      if (!error && (count ?? 0) > 0) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Unexpected error in hasProductRelations:", error);
    return true;
  }
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
 * Soft-delete a product by setting deleted_at and is_active = false.
 */
export async function softDeleteProduct(id: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { error } = await supabase
      .from("products")
      .update({
        deleted_at: new Date().toISOString(),
          is_active: false,
          is_featured: false,
          is_trending: false,
        } as never)
      .eq("id", id);

    if (error) {
      console.error("Error soft-deleting product:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in softDeleteProduct:", error);
    return false;
  }
}

/**
 * Hard-delete a product row (DB-level).
 * Uses admin client to bypass RLS. Deletes dependent rows in tables that do not have
 * ON DELETE CASCADE (product_questions, product_answers, product_views, product_stats) first.
 * Caller must enforce admin authorization (e.g. in the server action).
 */
export async function hardDeleteProduct(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();

    // Tables that reference products(id) without ON DELETE CASCADE must be cleared first.
    const { data: questionIds } = await supabase
      .from("product_questions")
      .select("id")
      .eq("product_id", id);

    if (questionIds?.length) {
      const ids = (questionIds as { id: string }[]).map((q) => q.id);
      const { error: answersErr } = await supabase
        .from("product_answers")
        .delete()
        .in("product_question_id", ids);
      if (answersErr) {
        console.error("Error deleting product_answers:", answersErr);
        return false;
      }
    }

    const { error: questionsErr } = await supabase
      .from("product_questions")
      .delete()
      .eq("product_id", id);
    if (questionsErr) {
      console.error("Error deleting product_questions:", questionsErr);
      return false;
    }

    const { error: viewsErr } = await supabase
      .from("product_views")
      .delete()
      .eq("product_id", id);
    if (viewsErr) {
      console.error("Error deleting product_views:", viewsErr);
      return false;
    }

    const { error: statsErr } = await supabase
      .from("product_stats")
      .delete()
      .eq("product_id", id);
    if (statsErr) {
      console.error("Error deleting product_stats:", statsErr);
      return false;
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("Error hard-deleting product:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in hardDeleteProduct:", error);
    return false;
  }
}
