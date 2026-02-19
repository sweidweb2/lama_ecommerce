import {
  trackProductView,
  incrementProductViewsCount,
  incrementProductAddToCartCount,
  incrementProductPurchaseCount,
} from "@/repositories/product_view.repository";

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
    // Validate product ID
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
      // View was tracked but stats update failed - log but don't fail
      console.error("Failed to increment views count:", statsResult.error);
      // Still return success since the view was tracked
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
 * Increment add_to_cart_count for a product.
 * Gets the product_id from the customised_product_id.
 */
export async function incrementProductAddToCartService(
  customisedProductId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate customised product ID
    if (!customisedProductId || typeof customisedProductId !== "string" || customisedProductId.trim() === "") {
      return {
        success: false,
        error: "Invalid customised product ID",
      };
    }

    // Get the product_id from the customised product
    const { getProductVariantById } = await import("@/repositories/product_variant.repository");
    const variant = await getProductVariantById(customisedProductId);

    if (!variant) {
      return {
        success: false,
        error: "Product variant not found",
      };
    }

    const productId = variant.product_id;

    // Increment the add_to_cart_count
    const statsResult = await incrementProductAddToCartCount(productId);
    if (!statsResult.success) {
      console.error("Failed to increment add_to_cart_count:", statsResult.error);
      // Don't fail the cart operation if stats update fails
    }

    return { success: true };
  } catch (error) {
    console.error("Error in incrementProductAddToCartService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to increment add to cart count",
    };
  }
}

/**
 * Increment purchase_count for all products in an order.
 * Gets product_id from each order item's customised_product_id.
 * Increments once per order item (for each item that was purchased).
 */
export async function incrementPurchaseCountForOrderService(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate order ID
    if (!orderId || typeof orderId !== "string" || orderId.trim() === "") {
      return {
        success: false,
        error: "Invalid order ID",
      };
    }

    // Get order items
    const { getOrderItemsByOrderIdForAdmin } = await import("@/repositories/order.repository");
    const orderItems = await getOrderItemsByOrderIdForAdmin(orderId);

    if (orderItems.length === 0) {
      return {
        success: false,
        error: "No order items found for this order",
      };
    }

    // Get product_id from each order item's customised_product_id
    const { getProductVariantById } = await import("@/repositories/product_variant.repository");
    
    // Map to count how many times each product appears in the order
    // Key: product_id, Value: count of order items for that product
    const productCounts = new Map<string, number>();

    for (const orderItem of orderItems) {
      if (!orderItem.customised_product_id) {
        continue; // Skip items without customised_product_id
      }

      const variant = await getProductVariantById(orderItem.customised_product_id);
      if (variant && variant.product_id) {
        // Count occurrences of each product (increment per order item)
        const currentCount = productCounts.get(variant.product_id) || 0;
        productCounts.set(variant.product_id, currentCount + 1);
      }
    }

    // Increment purchase_count for each product (once per order item)
    const incrementPromises: Promise<{ success: boolean; error?: string }>[] = [];

    for (const [productId, count] of productCounts.entries()) {
      // Increment 'count' times for this product (once per order item)
      for (let i = 0; i < count; i++) {
        incrementPromises.push(incrementProductPurchaseCount(productId));
      }
    }

    // Execute all increments in parallel
    const results = await Promise.allSettled(incrementPromises);

    // Check if any failed
    const failures = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success));
    if (failures.length > 0) {
      console.error("Some purchase count increments failed:", failures);
      // Don't fail the entire operation if some increments fail
    }

    return { success: true };
  } catch (error) {
    console.error("Error in incrementPurchaseCountForOrderService:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to increment purchase count",
    };
  }
}
