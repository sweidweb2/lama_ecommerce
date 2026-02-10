import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import type { ProductWithRelations } from "@/types/product";

export interface GetProductsRepoParams {
  categoryId?: string | null;
  sort?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

const PRODUCT_SELECT =
  "*, brand:brands(*), category:categories(*), images:product_images(*), variants:product_variants(*)";

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
