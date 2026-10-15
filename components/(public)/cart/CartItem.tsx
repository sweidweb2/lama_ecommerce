"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { deleteCartItemAction, updateCartItemQuantityAction } from "@/actions/cart";
import type { ProductWithRelations } from "@/types/product";

interface CartItemProps {
  id: string;
  product: ProductWithRelations;
  quantity: number;
  stock: number;
  /** Checkout-effective unit price (price_override ?? base). */
  unitPrice?: number;
}

export function CartItem({
  id,
  product,
  quantity: initialQuantity,
  stock,
  unitPrice,
}: CartItemProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const isProcessingRef = useRef(false);

  const lineUnitPrice = unitPrice ?? product.price;

  const primaryImage =
    product.images?.find((img) => img.is_primary) || product.images?.[0];
  const imageUrl = primaryImage?.url_image || "/placeholder-product.webp";

  const handleQuantityChange = async (newQuantity: number) => {
    // Double-click protection
    if (isProcessingRef.current) return;
    
    // Validate quantity
    if (newQuantity < 1) {
      toast.error("Error", {
        description: "Quantity must be at least 1",
      });
      return;
    }

    if (newQuantity > stock) {
      const errorMessage = `Only ${stock} units available.`;
      setStockError(errorMessage);
      toast.error("Insufficient stock", {
        description: errorMessage,
      });
      // Clear error after 5 seconds
      setTimeout(() => setStockError(null), 5000);
      return;
    }

    // Clear any previous errors when validation passes
    setStockError(null);

    // Don't update if quantity hasn't changed
    if (newQuantity === quantity) {
      return;
    }

    isProcessingRef.current = true;
    setIsUpdating(true);

    try {
      const result = await updateCartItemQuantityAction(id, newQuantity);

      if (!result.success) {
        const errorMessage = result.error || "Failed to update quantity. Please try again.";
        // Check if error is related to stock
        if (errorMessage.toLowerCase().includes("stock") || errorMessage.toLowerCase().includes("available")) {
          setStockError(errorMessage);
          setTimeout(() => setStockError(null), 5000);
        }
        toast.error("Error", {
          description: errorMessage,
        });
        // Revert to previous quantity on error
        setQuantity(quantity);
        return;
      }

      // Update local state
      setQuantity(newQuantity);

      // Dispatch event to update floating cart button
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cart-updated'))
      }

      // Refresh the page to update subtotal
      router.refresh();
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      toast.error("Error", {
        description: "Failed to update quantity. Please try again.",
      });
      // Revert to previous quantity on error
      setQuantity(quantity);
    } finally {
      isProcessingRef.current = false;
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteCartItemAction(id);

      if (!result.success) {
        toast.error("Error", {
          description: result.error || "Failed to remove item from cart. Please try again.",
        });
        return;
      }

      toast.success("Item removed", {
        description: `${product.name} has been removed from your cart.`,
      });

      setOpen(false);
      
      // Dispatch event to update floating cart button
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cart-updated'))
      }
      
      // Refresh the page to update the cart
      router.refresh();
    } catch (error) {
      console.error("Error deleting cart item:", error);
      toast.error("Error", {
        description: "Failed to remove item from cart. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 sm:gap-4 rounded-2xl border border-border bg-secondary dark:bg-card p-3 sm:p-4" data-testid="cart-item" role="article" aria-label={`Cart item: ${product.name}`}>
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-muted border border-border/40 shrink-0">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 64px, 80px"
          />
        </div>

        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm md:text-base font-semibold line-clamp-2 sm:line-clamp-1" data-testid="cart-item-name">
              {product.name}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">
              {product.category?.name || "Category"}
            </p>
          </div>

          {/* Stock Validation Error Message */}
          {stockError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-1.5 sm:p-2" data-testid="stock-validation-error">
              <p className="text-[10px] sm:text-xs text-destructive font-medium">
                {stockError}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Quantity Controls */}
              <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1 || isUpdating}
                  aria-label="Decrease quantity"
                  data-testid="decrease-quantity-button"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-7 sm:w-8 text-center text-xs sm:text-sm font-medium" data-testid="cart-item-quantity">
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= stock || isUpdating}
                  aria-label="Increase quantity"
                  data-testid="increase-quantity-button"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {/* Stock Information Card */}
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-medium text-muted-foreground">
                <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                  stock > 0 ? 'bg-primary' : 'bg-destructive'
                }`}></span>
                <span data-testid="available-stock-text">
                  {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-bold" data-testid="cart-item-total">
              {formatPrice(lineUnitPrice * quantity)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors text-xs shrink-0"
          aria-label={`Remove ${product.name} from cart`}
          data-testid="remove-cart-item-button"
          title="Remove item from cart"
        >
          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove item from cart</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {product.name}
              </span>{" "}
              from your cart?
            </p>
            <p>This action cannot be undone. You can add it back later if needed.</p>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              loading={isDeleting}
            >
              Remove item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
