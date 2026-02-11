'use client';

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableWrapper } from "@/components/admin/table-wrapper";
import {
  CreateCategoryDialog,
  type AdminCategory,
} from "@/components/admin/category/create_form";
import { EditCategoryDialog } from "@/components/admin/category/edit_form";
import { DeleteCategoryDialog } from "@/components/admin/category/delete_dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface AdminCategoriesClientProps {
  categories: AdminCategory[];
  createCategoryAction: (formData: FormData) => void | Promise<void>;
  updateCategoryAction: (formData: FormData) => void | Promise<void>;
  deleteCategoryAction: (formData: FormData) => void | Promise<void>;
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const MAX_ROWS_PER_PAGE = 50;

export default function AdminCategoriesClient({
  categories,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
}: AdminCategoriesClientProps) {
  const [nameFilter, setNameFilter] = useState("");
  const [parentFilter, setParentFilter] = useState<string | "all">("all");
  const [rowsPerPage, setRowsPerPage] = useState<number>(ROWS_PER_PAGE_OPTIONS[0]);
  const [page, setPage] = useState(1);

  const parentOptions = useMemo(
    () =>
      Array.from(
        new Map(
          categories
            .filter((c) => !c.deleted_at)
            .map((c) => [c.id, c]),
        ).values(),
      ),
    [categories],
  );

  const filteredCategories = useMemo(() => {
    const nameQuery = nameFilter.trim().toLowerCase();

    return categories.filter((category) => {
      if (category.deleted_at) return false;

      if (nameQuery) {
        const matchesName =
          category.name.toLowerCase().includes(nameQuery) ||
          (category.slug ?? "").toLowerCase().includes(nameQuery);
        if (!matchesName) return false;
      }

      if (parentFilter !== "all") {
        if (parentFilter === "root") {
          if (category.parent_id !== null) return false;
        } else if (category.parent_id !== parentFilter) {
          return false;
        }
      }

      return true;
    });
  }, [categories, nameFilter, parentFilter]);

  const safeRowsPerPage = Math.min(rowsPerPage, MAX_ROWS_PER_PAGE);
  const pageCount = Math.max(1, Math.ceil(filteredCategories.length / safeRowsPerPage));
  const currentPage = Math.min(page, pageCount);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * safeRowsPerPage;
    return filteredCategories.slice(start, start + safeRowsPerPage);
  }, [filteredCategories, currentPage, safeRowsPerPage]);

  const handleChangeRowsPerPage = (value: string) => {
    const next = Number(value) || ROWS_PER_PAGE_OPTIONS[0];
    const clamped = Math.min(next, MAX_ROWS_PER_PAGE);
    setRowsPerPage(clamped);
    setPage(1);
  };

  const handleChangePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pageCount) return;
    setPage(nextPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Organize your catalog into categories loaded from your database.
          </p>
        </div>
        <CreateCategoryDialog
          parentOptions={categories}
          action={createCategoryAction}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1 w-full sm:w-64">
            <label className="text-xs font-medium text-muted-foreground">
              Search by name or slug
            </label>
            <Input
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Type to filter…"
              className="h-9"
            />
          </div>

          <div className="space-y-1 w-full sm:w-56">
            <label className="text-xs font-medium text-muted-foreground">
              Filter by parent
            </label>
            <Select
              value={parentFilter}
              onValueChange={(value) => {
                setParentFilter(value as typeof parentFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All parents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All parents</SelectItem>
                <SelectItem value="root">No parent (root)</SelectItem>
                {parentOptions.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Rows per page
            </label>
            <Select
              value={String(safeRowsPerPage)}
              onValueChange={handleChangeRowsPerPage}
            >
              <SelectTrigger className="h-9 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROWS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="hidden sm:table-cell">Parent</TableHead>
              <TableHead className="hidden sm:table-cell">Products</TableHead>
              <TableHead className="hidden sm:table-cell">Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCategories.map((category) => {
              const productsCount = 0; // TODO: wire real product counts per category

              const parent =
                category.parent_id &&
                categories.find((c) => c.id === category.parent_id);

              const isActive = category.is_active && category.deleted_at == null;

              return (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                      {category.slug ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {parent ? (
                      <span className="text-sm text-muted-foreground">
                        {parent.name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Root</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={productsCount > 0 ? "default" : "secondary"}>
                      {productsCount} product{productsCount === 1 ? "" : "s"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {new Date(category.created_at).toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                      <EditCategoryDialog
                        category={category}
                        allCategories={categories}
                        action={updateCategoryAction}
                      />
                      <DeleteCategoryDialog
                        category={{
                          id: category.id,
                          name: category.name,
                        }}
                        action={deleteCategoryAction}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrapper>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-medium">
            {filteredCategories.length === 0
              ? 0
              : (currentPage - 1) * safeRowsPerPage + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(currentPage * safeRowsPerPage, filteredCategories.length)}
          </span>{" "}
          of{" "}
          <span className="font-medium">{filteredCategories.length}</span>{" "}
          categories
        </p>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChangePage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page{" "}
            <span className="font-medium">
              {currentPage}
            </span>{" "}
            of{" "}
            <span className="font-medium">
              {pageCount}
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChangePage(currentPage + 1)}
            disabled={currentPage >= pageCount}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

