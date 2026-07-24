"use client";

import { LayoutList, Grid3x3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminProductsView } from "@/lib/admin/products-list-params";

interface ProductsViewToggleProps {
  currentView: AdminProductsView;
  onViewChange: (view: AdminProductsView) => void;
}

export function ProductsViewToggle({
  currentView,
  onViewChange,
}: ProductsViewToggleProps) {
  return (
    <Tabs
      value={currentView}
      onValueChange={(value) => onViewChange(value as AdminProductsView)}
    >
      <TabsList aria-label="Products view">
        <TabsTrigger value="table" className="gap-1.5 px-3">
          <LayoutList className="h-4 w-4" />
          Rows
        </TabsTrigger>
        <TabsTrigger value="grid" className="gap-1.5 px-3">
          <Grid3x3 className="h-4 w-4" />
          Grid
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
