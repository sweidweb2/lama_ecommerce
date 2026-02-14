"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2 } from "lucide-react";
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
import { deleteCartItemAction } from "@/actions/cart";
import type { ProductWithRelations } from "@/types/product";

interface CartItemProps {
  id: string;
  product: ProductWithRelations;
  quantity: number;
  stock: number;
}

export function CartItem({ id, product, quantity, stock }: CartItemProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const primaryImage =
    product.images?.find((img) => img.is_primary) || product.images?.[0];
  const imageUrl = primaryImage?.url_image || "/placeholder-product.webp";

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
      <div className="flex gap-4 rounded-2xl border border-black/5 bg-[#f9f9f9] dark:bg-card p-4">
        <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-muted border border-border/40 shrink-0">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>

        <div className="flex-1 flex flex-col justify-between gap-1">
          <div>
            <h2 className="text-sm sm:text-base font-semibold line-clamp-1">
              {product.name}
            </h2>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
              {product.category?.name || "Category"}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-1 text-[11px] font-medium">
                Qty: {quantity}
              </div>
              {/* Stock Information Card */}
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  stock > 0 ? 'bg-primary' : 'bg-destructive'
                }`}></span>
                {stock > 0 ? `${stock} in stock` : 'Out of stock'}
              </div>
            </div>
            <p className="text-sm font-bold">
              {formatPrice(product.price * quantity)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-8 w-8 flex items-center justify-center rounded-full border border-black/5 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors text-xs"
          aria-label={`Remove ${product.name} from cart`}
        >
          <Trash2 className="h-4 w-4" />
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
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : "Remove item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
