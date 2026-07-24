"use client";

import { useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { removeWishlistItemAction } from "@/actions/wishlist";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UnavailableWishlistCardProps {
  wishlistId: string;
}

export function UnavailableWishlistCard({
  wishlistId,
}: UnavailableWishlistCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [removed, setRemoved] = useState(false);
  const processingRef = useRef(false);

  const handleRemove = async () => {
    if (processingRef.current || removed) return;
    processingRef.current = true;
    setIsRemoving(true);

    try {
      const result = await removeWishlistItemAction(wishlistId);
      if (!result.success) {
        toast.error(result.error || "Failed to remove item", {
          description: "Please try again.",
        });
        return;
      }
      setRemoved(true);
      toast.success("Removed from wishlist", {
        description: "Unavailable item removed.",
      });
    } catch {
      toast.error("An unexpected error occurred", {
        description: "Please try again later.",
      });
    } finally {
      processingRef.current = false;
      setIsRemoving(false);
    }
  };

  if (removed) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted border border-dashed border-border/60">
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground px-3 text-center">
          <ImageIcon className="h-10 w-10 opacity-40" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Unavailable
          </span>
          <p className="text-[11px] leading-snug opacity-80">
            This product is no longer available.
          </p>
        </div>
        <div className="absolute top-2 right-2">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className={cn(
              "h-8 w-8 rounded-full bg-background/90 shadow-sm",
              "hover:bg-background",
            )}
            onClick={handleRemove}
            loading={isRemoving}
            loadingText=""
            aria-label="Remove unavailable item from wishlist"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="-mt-2 pb-1 px-1 flex flex-col gap-0.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
          Unavailable
        </p>
        <h3 className="text-sm font-semibold text-muted-foreground line-clamp-1">
          Product unavailable
        </h3>
      </div>
    </div>
  );
}
