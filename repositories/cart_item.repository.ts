import {
  createSupabaseServerActionClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CartItem } from "@/types/order";
import type { CreateCartItemInput } from "@/lib/validators/cart-item/create";
import type { UpdateCartItemInput } from "@/lib/validators/cart-item/update";
import type { ProductWithRelations } from "@/types/product";

/**
 * Create a new cart item.
 * If an item with the same customised_product_id already exists in the cart,
 * the quantity will be updated instead of creating a duplicate.
 */
export async function createCartItem(
  input: CreateCartItemInput & { cart_id: string },
): Promise<{ success: boolean; error?: string; data?: CartItem }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    // Check if item already exists in cart
    const { data: existingItem, error: checkError } = await (supabase as any)
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", input.cart_id)
      .eq("customised_product_id", input.customised_product_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected if item doesn't exist
      console.error("Error checking existing cart item:", checkError);
      return {
        success: false,
        error: "Failed to check for existing cart item",
      };
    }

    // If item exists, update quantity instead of creating duplicate
    if (existingItem) {
      const newQuantity = (existingItem.quantity || 0) + input.quantity;
      const { data, error } = await (supabase as any)
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", existingItem.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating cart item quantity:", error);
        return {
          success: false,
          error: error.message || "Failed to update cart item",
        };
      }

      return {
        success: true,
        data: data as CartItem,
      };
    }

    // Insert new cart item
    const { data, error } = await (supabase as any)
      .from("cart_items")
      .insert({
        cart_id: input.cart_id,
        customised_product_id: input.customised_product_id,
        quantity: input.quantity,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating cart item:", error);
      return {
        success: false,
        error: error.message || "Failed to create cart item",
      };
    }

    return {
      success: true,
      data: data as CartItem,
    };
  } catch (error) {
    console.error("Unexpected error in createCartItem:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Get a cart item by ID.
 * RLS policy ensures users can only access items from their own carts.
 */
export async function getCartItemById(
  cartItemId: string,
): Promise<{ success: boolean; error?: string; data?: CartItem }> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await (supabase as any)
      .from("cart_items")
      .select("*")
      .eq("id", cartItemId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      console.error("Error fetching cart item:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch cart item",
      };
    }

    if (!data) {
      return {
        success: false,
        error: "Cart item not found",
      };
    }

    return {
      success: true,
      data: data as CartItem,
    };
  } catch (error) {
    console.error("Unexpected error in getCartItemById:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Get all cart items for a specific cart.
 * RLS policy ensures users can only access items from their own carts.
 */
export async function getCartItemsByCartId(
  cartId: string,
): Promise<CartItem[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await (supabase as any)
      .from("cart_items")
      .select("*")
      .eq("cart_id", cartId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching cart items:", error);
      return [];
    }

    return (data ?? []) as CartItem[];
  } catch (error) {
    console.error("Unexpected error in getCartItemsByCartId:", error);
    return [];
  }
}

/**
 * Get cart items with full product details for a specific cart.
 * Returns cart items with product, images, category, and brand information.
 * RLS policy ensures users can only access items from their own carts.
 */
export interface CartItemWithProduct {
  id: string;
  cart_id: string;
  customised_product_id: string;
  quantity: number;
  created_at: string;
  product: ProductWithRelations;
  stock: number; // Available stock for the customized product variant
}

export async function getCartItemsWithProductsByCartId(
  cartId: string,
): Promise<CartItemWithProduct[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    
    // Fetch cart items with nested product data
    const { data: cartItems, error: cartItemsError } = await (supabase as any)
      .from("cart_items")
      .select(`
        id,
        cart_id,
        customised_product_id,
        quantity,
        created_at,
        customised_products (
          id,
          product_id,
          color,
          size,
          material,
          quantity_stock,
          products (
            id,
            name,
            description,
            slug,
            price,
            is_featured,
            is_trending,
            is_active,
            brand_id,
            category_id,
            brands (
              id,
              name,
              slug
            ),
            categories (
              id,
              name,
              slug
            ),
            product_images (
              id,
              url_image,
              is_primary
            )
          )
        )
      `)
      .eq("cart_id", cartId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (cartItemsError) {
      console.error("Error fetching cart items with products:", cartItemsError);
      return [];
    }

    if (!cartItems || cartItems.length === 0) {
      return [];
    }

    // Transform the data to match CartItemWithProduct interface
    const transformedItems: CartItemWithProduct[] = cartItems
      .filter((item: any) => item.customised_products?.products)
      .map((item: any) => {
        const productData = item.customised_products.products;
        const product: ProductWithRelations = {
          id: productData.id,
          name: productData.name,
          description: productData.description,
          slug: productData.slug,
          price: parseFloat(productData.price),
          is_featured: productData.is_featured,
          is_trending: productData.is_trending,
          is_active: productData.is_active,
          brand_id: productData.brand_id,
          category_id: productData.category_id,
          brand: productData.brands || null,
          category: productData.categories || null,
          images: productData.product_images || [],
          variants: undefined, // Not needed for cart display
          stats: null, // Not needed for cart display
        };

        return {
          id: item.id,
          cart_id: item.cart_id,
          customised_product_id: item.customised_product_id,
          quantity: item.quantity,
          created_at: item.created_at,
          product,
          stock: item.customised_products?.quantity_stock || 0,
        };
      });

    return transformedItems;
  } catch (error) {
    console.error("Unexpected error in getCartItemsWithProductsByCartId:", error);
    return [];
  }
}

/**
 * Update a cart item (typically quantity).
 * RLS policy ensures users can only update items from their own carts.
 */
export async function updateCartItem(
  cartItemId: string,
  input: UpdateCartItemInput,
): Promise<{ success: boolean; error?: string; data?: CartItem }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    // Build update payload with only provided fields
    const updatePayload: Record<string, unknown> = {};
    if (input.quantity !== undefined) {
      if (input.quantity < 1) {
        return {
          success: false,
          error: "Quantity must be at least 1",
        };
      }
      updatePayload.quantity = input.quantity;
    }
    if (input.customised_product_id !== undefined) {
      updatePayload.customised_product_id = input.customised_product_id;
    }

    // If no fields to update, return early
    if (Object.keys(updatePayload).length === 0) {
      return {
        success: false,
        error: "No fields to update",
      };
    }

    const { data, error } = await (supabase as any)
      .from("cart_items")
      .update(updatePayload)
      .eq("id", cartItemId)
      .select()
      .single();

    if (error) {
      console.error("Error updating cart item:", error);
      return {
        success: false,
        error: error.message || "Failed to update cart item",
      };
    }

    return {
      success: true,
      data: data as CartItem,
    };
  } catch (error) {
    console.error("Unexpected error in updateCartItem:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Soft-delete a cart item by setting deleted_at.
 * RLS policy ensures users can only delete items from their own carts.
 */
export async function deleteCartItem(
  cartItemId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { error } = await (supabase as any)
      .from("cart_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", cartItemId);

    if (error) {
      console.error("Error deleting cart item:", error);
      return {
        success: false,
        error: error.message || "Failed to delete cart item",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error in deleteCartItem:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Hard-delete a cart item (permanently remove from database).
 * RLS policy ensures users can only delete items from their own carts.
 */
export async function hardDeleteCartItem(
  cartItemId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { error } = await (supabase as any)
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);

    if (error) {
      console.error("Error hard deleting cart item:", error);
      return {
        success: false,
        error: error.message || "Failed to delete cart item",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error in hardDeleteCartItem:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Hard-delete all cart items for a specific cart (permanently remove from database).
 * Used when deleting a cart - all its items must be deleted first.
 * Uses admin client to bypass RLS for admin operations.
 */
export async function hardDeleteCartItemsByCartId(
  cartId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await (supabase as any)
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId);

    if (error) {
      console.error("Error hard deleting cart items by cart ID:", error);
      return {
        success: false,
        error: error.message || "Failed to delete cart items",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error in hardDeleteCartItemsByCartId:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}
