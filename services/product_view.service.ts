import {
  getAllProductViewsForAdmin,
  getProductViewsByProductIdForAdmin,
  getProductViewsStats,
  trackProductView,
  incrementProductViewsCount,
  incrementProductAddToCartCount,
  incrementProductPurchaseCount,
  getProductStatsByProductId,
  type AdminProductViewRow,
  type ProductViewsStats,
} from "@/repositories/product_view.repository";
import type { ProductStats } from "@/types/product_utf8";
import { getProductVariantById } from "@/repositories/product_variant.repository";
import { getOrderItemsByOrderIdForAdmin } from "@/repositories/order.repository";
import { requireAdmin } from "@/lib/auth/require-admin";

const EMPTY_PRODUCT_VIEWS_PAGE = {
  data: [] as AdminProductViewRow[],
  total: 0,
  page: 1,
  pageSize: 50,
  totalPages: 0,
};

const EMPTY_PRODUCT_VIEWS_STATS: ProductViewsStats = {
  totalViews: 0,
  uniqueProducts: 0,
  uniqueUsers: 0,
  viewsToday: 0,
  viewsThisWeek: 0,
  viewsThisMonth: 0,
};

/**
 * Get all product views for admin with pagination
 */
export async function getAllProductViewsForAdminService(
  page: number = 1,
  pageSize: number = 50,
): Promise<{
  data: AdminProductViewRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  try {
    await requireAdmin();
  } catch {
    return { ...EMPTY_PRODUCT_VIEWS_PAGE, page, pageSize };
  }
  return getAllProductViewsForAdmin(page, pageSize);
}

/**
 * Get product views for a specific product with pagination
 */
export async function getProductViewsByProductIdService(
  productId: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<{
  data: AdminProductViewRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  try {
    await requireAdmin();
  } catch {
    return { ...EMPTY_PRODUCT_VIEWS_PAGE, page, pageSize };
  }
  return getProductViewsByProductIdForAdmin(productId, page, pageSize);
}

/**
 * Get product views statistics
 */
export async function getProductViewsStatsService(): Promise<ProductViewsStats> {
  try {
    await requireAdmin();
  } catch {
    return EMPTY_PRODUCT_VIEWS_STATS;
  }
  return getProductViewsStats();
}

/**
 * Track a product view and increment the views count.
 * Handles both authenticated users and guests.
 */
export async function trackProductViewService(
  productId: string,
  userId: string | null,
  sessionId: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!productId || typeof productId !== "string" || productId.trim() === "") {
      return {
        success: false,
        error: "Invalid product ID",
      };
    }

    // Track the view
    const viewResult = await trackProductView(productId, userId, sessionId);
    if (!viewResult.success) {
      return viewResult;
    }

    // Increment the views count
    const statsResult = await incrementProductViewsCount(productId);
    if (!statsResult.success) {
      console.error("Failed to increment views count:", statsResult.error);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in trackProductViewService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to track product view",
    };
  }
}

/**
 * Get product stats for a given product.
 * Returns stats with default values (0) if no record exists.
 */
export async function getProductStatsService(
  productId: string,
): Promise<ProductStats | null> {
  try {
    if (!productId || typeof productId !== "string" || productId.trim() === "") {
      return null;
    }

    const stats = await getProductStatsByProductId(productId);
    return stats;
  } catch (error) {
    console.error("Error in getProductStatsService:", error);
    return null;
  }
}

/**
 * Increment add_to_cart_count for a product.
 * Takes a customised_product_id, gets the product_id, and increments the count.
 */
export async function incrementProductAddToCartService(
  customisedProductId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the variant to extract product_id
    const variant = await getProductVariantById(customisedProductId);
    
    if (!variant) {
      return {
        success: false,
        error: "Product variant not found",
      };
    }

    // Increment the add_to_cart_count using the product_id
    return await incrementProductAddToCartCount(variant.product_id);
  } catch (error) {
    console.error("Error in incrementProductAddToCartService:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Increment purchase_count for all products in an order.
 * Gets all order items, extracts product_ids from customised_products,
 * and increments purchase_count for each product (by quantity).
 */
export async function incrementPurchaseCountForOrderService(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all order items for this order
    const orderItems = await getOrderItemsByOrderIdForAdmin(orderId);

    if (!orderItems || orderItems.length === 0) {
      return { success: true }; // No items to process
    }

    // Get unique customised_product_ids
    const customisedProductIds = [
      ...new Set(
        orderItems
          .map((item) => item.customised_product_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    if (customisedProductIds.length === 0) {
      return { success: true }; // No product IDs to process
    }

    // Get all variants to extract product_ids
    const variants = await Promise.all(
      customisedProductIds.map((id) => getProductVariantById(id))
    );

    // Create a map of customised_product_id -> product_id
    const productIdMap = new Map<string, string>();
    variants.forEach((variant, index) => {
      if (variant) {
        productIdMap.set(customisedProductIds[index], variant.product_id);
      }
    });

    // Group order items by product_id and sum quantities
    const productQuantities = new Map<string, number>();
    orderItems.forEach((item) => {
      if (item.customised_product_id) {
        const productId = productIdMap.get(item.customised_product_id);
        if (productId) {
          const currentQuantity = productQuantities.get(productId) || 0;
          productQuantities.set(
            productId,
            currentQuantity + (item.quantity || 1)
          );
        }
      }
    });

    // Increment purchase_count for each product (by quantity)
    const incrementPromises = Array.from(productQuantities.entries()).map(
      async ([productId, quantity]) => {
        return await incrementProductPurchaseCount(productId, quantity);
      }
    );

    const results = await Promise.all(incrementPromises);
    const allSucceeded = results.every((r) => r.success);

    if (!allSucceeded) {
      console.error("Some purchase count increments failed");
      return {
        success: false,
        error: "Some purchase count increments failed",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in incrementPurchaseCountForOrderService:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}
