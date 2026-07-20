import {
  createSupabaseServerActionClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CartItem } from "@/types/order";
import type { CreateCartItemInput } from "@/lib/validators/cart-item/create";
import type { UpdateCartItemInput } from "@/lib/validators/cart-item/update";
import type { ProductWithRelations } from "@/types/product";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Create or update a cart item (UPSERT) - Double-click safe.
 * Uses database function for atomic operation with stock validation.
 * Authenticated path: session client (EXECUTE granted to authenticated).
 */
export async function createCartItem(
  input: CreateCartItemInput & { cart_id: string },
): Promise<{ success: boolean; error?: string; data?: CartItem }> {
  try {
    const supabase = await createSupabaseServerActionClient();
    return await upsertCartItemWithClient(supabase, input);
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
 * Upsert a cart item via service-role client.
 * Required for guest carts after guest RLS bypasses were removed.
 */
export async function createCartItemAsAdmin(
  input: CreateCartItemInput & { cart_id: string },
): Promise<{ success: boolean; error?: string; data?: CartItem }> {
  try {
    const supabase = createSupabaseAdminClient();
    return await upsertCartItemWithClient(supabase, input);
  } catch (error) {
    console.error("Unexpected error in createCartItemAsAdmin:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

async function upsertCartItemWithClient(
  supabase: SupabaseClient<Database>,
  input: CreateCartItemInput & { cart_id: string },
): Promise<{ success: boolean; error?: string; data?: CartItem }> {
  const { data, error } = await supabase.rpc("upsert_cart_item", {
    p_cart_id: input.cart_id,
    p_customised_product_id: input.customised_product_id,
    p_quantity: input.quantity,
  });

  if (error) {
    console.error("Error upserting cart item:", error);

    let errorMessage = error.message || "Failed to add item to cart";

    if (error.message?.includes("not found or deleted")) {
      errorMessage = "Product variant not found or no longer available";
    } else if (error.message?.includes("out of stock")) {
      errorMessage = "This product variant is out of stock";
    } else if (error.message?.includes("Insufficient stock")) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }

  if (!data || data.length === 0) {
    return {
      success: false,
      error: "Failed to add item to cart - no data returned",
    };
  }

  return {
    success: true,
    data: data[0] as CartItem,
  };
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
    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("id", cartItemId)
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
    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", cartId)
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
  /** Unit price charged at checkout: COALESCE(price_override, products.price). */
  unitPrice: number;
  stock: number; // Available stock for the customized product variant
  color?: string | null;
  size?: string | null;
  material?: string | null;
}

/** Nested select shape used when loading cart items with product details. */
interface CartItemProductJoinRow {
  id: string;
  cart_id: string;
  customised_product_id: string;
  quantity: number;
  created_at: string;
  customised_products: {
    id: string;
    product_id: string;
    color: string | null;
    size: string | null;
    material: string | null;
    quantity_stock: number;
    price_override: number | string | null;
    products: {
      id: string;
      name: string;
      description: string | null;
      slug: string;
      price: number | string;
      is_featured: boolean;
      is_trending: boolean;
      is_active: boolean;
      brand_id: string | null;
      category_id: string | null;
      sku?: string | null;
      owner_id?: string | null;
      created_at: string;
      updated_at: string;
      brands: { id: string; name: string; slug: string | null } | null;
      categories: { id: string; name: string; slug: string | null } | null;
      product_images: Array<{
        id: string;
        url_image: string;
        is_primary: boolean;
      }>;
    } | null;
  } | null;
}

/**
 * Checkout unit price: COALESCE(price_override, base products.price).
 * Matches process_checkout RPC pricing.
 */
export function resolveCartUnitPrice(
  priceOverride: number | string | null | undefined,
  basePrice: number | string,
): number {
  if (priceOverride !== null && priceOverride !== undefined && priceOverride !== "") {
    return parseFloat(String(priceOverride));
  }
  return parseFloat(String(basePrice));
}

function transformCartItemProductJoin(
  item: CartItemProductJoinRow,
): CartItemWithProduct | null {
  const productData = item.customised_products?.products;
  if (!productData) {
    return null;
  }

  const basePrice = parseFloat(String(productData.price));
  const unitPrice = resolveCartUnitPrice(
    item.customised_products?.price_override,
    basePrice,
  );

  const product: ProductWithRelations = {
    id: productData.id,
    name: productData.name,
    description: productData.description,
    slug: productData.slug,
    // Expose checkout-effective price so existing product.price consumers match RPC.
    price: unitPrice,
    min_effective_price: unitPrice,
    max_effective_price: unitPrice,
    is_featured: productData.is_featured,
    is_trending: productData.is_trending,
    is_active: productData.is_active,
    brand_id: productData.brand_id,
    category_id: productData.category_id,
    sku: productData.sku || null,
    owner_id: productData.owner_id || null,
    created_at: productData.created_at,
    updated_at: productData.updated_at,
    brand: (productData.brands as ProductWithRelations["brand"]) || null,
    category: (productData.categories as ProductWithRelations["category"]) || null,
    images: (productData.product_images || []) as ProductWithRelations["images"],
    variants: undefined,
    stats: null,
  };

  return {
    id: item.id,
    cart_id: item.cart_id,
    customised_product_id: item.customised_product_id,
    quantity: item.quantity,
    created_at: item.created_at,
    product,
    unitPrice,
    stock: item.customised_products?.quantity_stock || 0,
    color: item.customised_products?.color || null,
    size: item.customised_products?.size || null,
    material: item.customised_products?.material || null,
  };
}

export async function getCartItemsWithProductsByCartId(
  cartId: string,
): Promise<CartItemWithProduct[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    
    // Fetch cart items with nested product data
    const { data: cartItems, error: cartItemsError } = await supabase
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
          price_override,
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
      .order("created_at", { ascending: true });

    if (cartItemsError) {
      console.error("Error fetching cart items with products:", cartItemsError);
      return [];
    }

    if (!cartItems || cartItems.length === 0) {
      return [];
    }

    // Transform the data to match CartItemWithProduct interface
    const rows = cartItems as unknown as CartItemProductJoinRow[];
    const transformedItems: CartItemWithProduct[] = rows
      .map(transformCartItemProductJoin)
      .filter((item): item is CartItemWithProduct => item !== null);

    return transformedItems;
  } catch (error) {
    console.error("Unexpected error in getCartItemsWithProductsByCartId:", error);
    return [];
  }
}

/**
 * Get cart items with full product details for a specific cart (admin version).
 * Uses admin client to bypass RLS for admin access.
 */
export async function getCartItemsWithProductsByCartIdForAdmin(
  cartId: string,
): Promise<CartItemWithProduct[]> {
  try {
    const supabase = createSupabaseAdminClient();
    
    // Fetch cart items with nested product data
    const { data: cartItems, error: cartItemsError } = await supabase
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
          price_override,
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
      .order("created_at", { ascending: true });

    if (cartItemsError) {
      console.error("Error fetching cart items with products (admin):", cartItemsError);
      return [];
    }

    if (!cartItems || cartItems.length === 0) {
      return [];
    }

    // Transform the data to match CartItemWithProduct interface
    const rows = cartItems as unknown as CartItemProductJoinRow[];
    const transformedItems: CartItemWithProduct[] = rows
      .map(transformCartItemProductJoin)
      .filter((item): item is CartItemWithProduct => item !== null);

    return transformedItems;
  } catch (error) {
    console.error("Unexpected error in getCartItemsWithProductsByCartIdForAdmin:", error);
    return [];
  }
}

/**
 * Validate quantity against variant stock (same rules as upsert_cart_item).
 */
async function assertCartItemQuantityWithinStock(
  supabase: SupabaseClient<Database>,
  cartItemId: string,
  quantity: number,
  customisedProductIdOverride?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  if (quantity < 1) {
    return { success: false, error: "Quantity must be at least 1" };
  }

  const { data: cartItem, error: cartItemError } = await supabase
    .from("cart_items")
    .select("id, customised_product_id")
    .eq("id", cartItemId)
    .maybeSingle();

  if (cartItemError) {
    return {
      success: false,
      error: cartItemError.message || "Failed to fetch cart item",
    };
  }

  if (!cartItem) {
    return { success: false, error: "Cart item not found" };
  }

  const variantId =
    customisedProductIdOverride ?? cartItem.customised_product_id;

  const { data: variant, error: variantError } = await supabase
    .from("customised_products")
    .select("id, quantity_stock")
    .eq("id", variantId)
    .maybeSingle();

  if (variantError) {
    return {
      success: false,
      error: variantError.message || "Failed to fetch product stock",
    };
  }

  if (!variant) {
    return { success: false, error: "Product variant not found" };
  }

  if (variant.quantity_stock <= 0) {
    return { success: false, error: "This product variant is out of stock" };
  }

  if (quantity > variant.quantity_stock) {
    return {
      success: false,
      error: `Insufficient stock. Available: ${variant.quantity_stock}, Requested: ${quantity}`,
    };
  }

  return { success: true };
}

/**
 * Update a cart item (typically quantity).
 * Re-validates stock when quantity changes (same rules as upsert_cart_item).
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
      const stockCheck = await assertCartItemQuantityWithinStock(
        supabase,
        cartItemId,
        input.quantity,
        input.customised_product_id,
      );
      if (!stockCheck.success) {
        return { success: false, error: stockCheck.error };
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

    const { data, error } = await supabase
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
 * Update a cart item (admin version).
 * Uses admin client to bypass RLS for admin access.
 * Re-validates stock when quantity changes (same rules as upsert_cart_item).
 */
export async function updateCartItemForAdmin(
  cartItemId: string,
  input: UpdateCartItemInput,
): Promise<{ success: boolean; error?: string; data?: CartItem }> {
  try {
    const supabase = createSupabaseAdminClient();

    // Build update payload with only provided fields
    const updatePayload: Record<string, unknown> = {};
    if (input.quantity !== undefined) {
      const stockCheck = await assertCartItemQuantityWithinStock(
        supabase,
        cartItemId,
        input.quantity,
        input.customised_product_id,
      );
      if (!stockCheck.success) {
        return { success: false, error: stockCheck.error };
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

    const { data, error } = await supabase
      .from("cart_items")
      .update(updatePayload)
      .eq("id", cartItemId)
      .select()
      .single();

    if (error) {
      console.error("Error updating cart item (admin):", error);
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
    console.error("Unexpected error in updateCartItemForAdmin:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Hard-delete a cart item.
 * RLS policy ensures users can only delete items from their own carts.
 */
export async function deleteCartItem(
  cartItemId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { error } = await supabase
      .from("cart_items")
      .delete()
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

    const { error } = await supabase
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
 * Hard-delete a cart item (admin). Uses service role to bypass RLS.
 */
export async function hardDeleteCartItemForAdmin(
  cartItemId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);

    if (error) {
      console.error("Error hard deleting cart item (admin):", error);
      return {
        success: false,
        error: error.message || "Failed to delete cart item",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in hardDeleteCartItemForAdmin:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Verify a cart item belongs to a guest session cart (service role).
 */
async function assertCartItemOwnedByGuestSession(
  cartItemId: string,
  sessionId: string,
): Promise<{ ok: true; cartId: string } | { ok: false; error: string }> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("id, cart_id, carts!inner(id, session_id, user_id)")
    .eq("id", cartItemId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message || "Failed to verify cart item" };
  }
  if (!data) {
    return { ok: false, error: "Cart item not found" };
  }

  const cart = data.carts as unknown as {
    id: string;
    session_id: string | null;
    user_id: string | null;
  };

  if (
    cart.user_id !== null ||
    cart.session_id !== sessionId
  ) {
    return { ok: false, error: "Cart item does not belong to this session" };
  }

  return { ok: true, cartId: cart.id };
}

/**
 * Update a guest cart item quantity, scoped to guest session_id.
 */
export async function updateCartItemForGuest(
  sessionId: string,
  cartItemId: string,
  input: UpdateCartItemInput,
): Promise<{ success: boolean; error?: string; data?: CartItem }> {
  try {
    const owned = await assertCartItemOwnedByGuestSession(cartItemId, sessionId);
    if (!owned.ok) {
      return { success: false, error: owned.error };
    }

    return await updateCartItemForAdmin(cartItemId, input);
  } catch (error) {
    console.error("Unexpected error in updateCartItemForGuest:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Hard-delete a guest cart item, scoped to guest session_id.
 */
export async function hardDeleteCartItemForGuest(
  sessionId: string,
  cartItemId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const owned = await assertCartItemOwnedByGuestSession(cartItemId, sessionId);
    if (!owned.ok) {
      return { success: false, error: owned.error };
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);

    if (error) {
      console.error("Error hard deleting guest cart item:", error);
      return {
        success: false,
        error: error.message || "Failed to delete cart item",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in hardDeleteCartItemForGuest:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Move all cart items from one cart to another, merging duplicates.
 *
 * For each item in the source cart:
 * - Assert destination quantity fits stock (same rules as ATC / qty update).
 * - If the destination cart already has the same customised_product_id → add quantities, then hard-delete the source item.
 * - Otherwise → update the item's cart_id to the destination cart.
 *
 * On stock failure: abort immediately; leave remaining source rows in the guest cart.
 * Uses admin client to bypass RLS since this crosses cart ownership boundaries.
 */
export async function moveCartItemsToCart(
  fromCartId: string,
  toCartId: string,
): Promise<{ success: boolean; error?: string; movedCount: number }> {
  try {
    const supabase = createSupabaseAdminClient();

    // 1. Get all items in the source (guest) cart
    const { data: sourceItems, error: srcError } = await supabase
      .from("cart_items")
      .select("id, customised_product_id, quantity")
      .eq("cart_id", fromCartId);

    if (srcError) {
      console.error("Error fetching source cart items:", srcError);
      return { success: false, error: srcError.message, movedCount: 0 };
    }

    if (!sourceItems || sourceItems.length === 0) {
      return { success: true, movedCount: 0 };
    }

    // 2. Get all items in the destination (user) cart
    const { data: destItems, error: dstError } = await supabase
      .from("cart_items")
      .select("id, customised_product_id, quantity")
      .eq("cart_id", toCartId);

    if (dstError) {
      console.error("Error fetching destination cart items:", dstError);
      return { success: false, error: dstError.message, movedCount: 0 };
    }

    // Build lookup map: customised_product_id → dest item
    const destMap = new Map<string, { id: string; quantity: number }>();
    (destItems ?? []).forEach((item) => {
      destMap.set(item.customised_product_id, {
        id: item.id,
        quantity: item.quantity,
      });
    });

    let movedCount = 0;

    // 3. Process each source item
    for (const srcItem of sourceItems as {
      id: string;
      customised_product_id: string;
      quantity: number;
    }[]) {
      const existing = destMap.get(srcItem.customised_product_id);
      const destinationQty = (existing?.quantity ?? 0) + srcItem.quantity;

      const stockCheck = await assertCartItemQuantityWithinStock(
        supabase,
        existing?.id ?? srcItem.id,
        destinationQty,
        srcItem.customised_product_id,
      );
      if (!stockCheck.success) {
        return {
          success: false,
          error: stockCheck.error,
          movedCount,
        };
      }

      if (existing) {
        // Duplicate: merge quantities into the destination item, then hard-delete source item
        const { error: updateErr } = await supabase
          .from("cart_items")
          .update({ quantity: destinationQty })
          .eq("id", existing.id);

        if (updateErr) {
          console.error("Error merging cart item quantity:", updateErr);
          return {
            success: false,
            error: updateErr.message || "Failed to merge cart item quantity",
            movedCount,
          };
        }

        // Hard-delete the source item
        await supabase.from("cart_items").delete().eq("id", srcItem.id);

        destMap.set(srcItem.customised_product_id, {
          id: existing.id,
          quantity: destinationQty,
        });
      } else {
        // No duplicate: move item to destination cart
        const { error: moveErr } = await supabase
          .from("cart_items")
          .update({ cart_id: toCartId })
          .eq("id", srcItem.id);

        if (moveErr) {
          console.error("Error moving cart item:", moveErr);
          return {
            success: false,
            error: moveErr.message || "Failed to move cart item",
            movedCount,
          };
        }

        destMap.set(srcItem.customised_product_id, {
          id: srcItem.id,
          quantity: srcItem.quantity,
        });
      }

      movedCount++;
    }

    return { success: true, movedCount };
  } catch (error) {
    console.error("Unexpected error in moveCartItemsToCart:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
      movedCount: 0,
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

    const { error } = await supabase
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
