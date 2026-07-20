"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TableWrapper } from "@/components/admin/table-wrapper";
import { CreateQuestionDialog, type AdminQuestion } from "@/components/admin/qa/create_form";
import { EditQuestionDialog } from "@/components/admin/qa/edit_form";
import { DeleteQuestionDialog } from "@/components/admin/qa/delete_dialog";
import { ViewQuestionDialog } from "@/components/admin/qa/view_dialog";
import type { AdminQuestionRow } from "@/repositories/product_question.repository";
import type { ProductOption, ProfileOption } from "./create_form";
import { X } from "lucide-react";

type QaStatusKey = "pending" | "needs_answer" | "pending_approval" | "answered";

const getStatusKey = (
  approved: boolean,
  answer: string | null,
): QaStatusKey => {
  if (approved && answer) return "answered";
  if (approved && !answer) return "needs_answer";
  if (!approved && answer) return "pending_approval";
  return "pending";
};

const STATUS_LABELS: Record<QaStatusKey, string> = {
  answered: "Answered",
  needs_answer: "Needs Answer",
  pending_approval: "Pending Approval",
  pending: "Pending",
};

const getStatusLabel = (approved: boolean, answer: string | null) =>
  STATUS_LABELS[getStatusKey(approved, answer)];

const getStatusVariant = (approved: boolean, answer: string | null) => {
  switch (getStatusKey(approved, answer)) {
    case "answered":
      return "default" as const;
    case "needs_answer":
    case "pending_approval":
      return "outline" as const;
    case "pending":
    default:
      return "secondary" as const;
  }
};

interface QATableProps {
  questions: AdminQuestionRow[];
  products: ProductOption[];
  profiles: ProfileOption[];
  error?: string | null;
}

export function QATable({ questions, products, profiles, error }: QATableProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const items: AdminQuestion[] = useMemo(
    () =>
      questions.map((q) => ({
        id: q.id,
        product_id: q.product_id,
        product_name: q.product_name,
        user_id: q.user_id,
        user_name: q.user_name,
        question: q.question,
        answer: q.answer,
        is_approved: q.is_approved,
        created_at: q.created_at,
      })),
    [questions],
  );

  const filteredItems = useMemo(() => {
    const searchTerm = searchFilter.trim().toLowerCase();
    return items.filter((item) => {
      const statusKey = getStatusKey(item.is_approved, item.answer);
      if (statusFilter !== "all" && statusKey !== statusFilter) return false;

      if (!searchTerm) return true;

      const userName = item.user_name || "Guest / Anonymous";
      return (
        item.question.toLowerCase().includes(searchTerm) ||
        item.product_name.toLowerCase().includes(searchTerm) ||
        userName.toLowerCase().includes(searchTerm)
      );
    });
  }, [items, searchFilter, statusFilter]);

  const hasActiveFilters =
    searchFilter.trim() !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setSearchFilter("");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Q&A</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage customer questions and answers
          </p>
        </div>
        <div className="mt-1">
          <CreateQuestionDialog products={products} profiles={profiles} />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Error loading Q&A</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-1 flex-1 min-w-[200px] max-w-sm">
              <Label htmlFor="qa-filter-search">Search</Label>
              <Input
                id="qa-filter-search"
                placeholder="Question, product, or user…"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <div className="space-y-1 w-full sm:w-[200px]">
              <Label htmlFor="qa-filter-status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="qa-filter-status" className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="needs_answer">Needs Answer</SelectItem>
                  <SelectItem value="pending_approval">
                    Pending Approval
                  </SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      {hasActiveFilters
                        ? "No questions found matching the filters."
                        : "No questions yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const statusLabel = getStatusLabel(
                      item.is_approved,
                      item.answer,
                    );
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium max-w-md truncate">
                          {item.question}
                        </TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>
                          {item.user_name || "Guest / Anonymous"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(
                              item.is_approved,
                              item.answer,
                            )}
                          >
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ViewQuestionDialog question={item} />
                            <EditQuestionDialog question={item} />
                            <DeleteQuestionDialog
                              question={{
                                id: item.id,
                                product_name: item.product_name,
                                question: item.question,
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        </>
      )}
    </div>
  );
}
