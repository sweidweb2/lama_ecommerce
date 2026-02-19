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
import { TableWrapper } from "@/components/admin/table-wrapper";
import { CreateQuestionDialog, type AdminQuestion } from "@/components/admin/qa/create_form";
import { EditQuestionDialog } from "@/components/admin/qa/edit_form";
import { DeleteQuestionDialog } from "@/components/admin/qa/delete_dialog";
import { ViewQuestionDialog } from "@/components/admin/qa/view_dialog";
import type { AdminQuestionRow } from "@/repositories/product_question.repository";
import type { ProductOption, ProfileOption } from "./create_form";

const getStatusLabel = (approved: boolean, answer: string | null) => {
  if (approved && answer) return "Answered";
  if (!approved && answer) return "Pending Approval";
  return "Pending";
};

const getStatusVariant = (approved: boolean, answer: string | null) => {
  const label = getStatusLabel(approved, answer);
  switch (label) {
    case "Answered":
      return "default";
    case "Pending Approval":
      return "outline";
    case "Pending":
    default:
      return "secondary";
  }
};

interface QATableProps {
  questions: AdminQuestionRow[];
  products: ProductOption[];
  profiles: ProfileOption[];
}

export function QATable({ questions, products, profiles }: QATableProps) {
  const [nameFilter, setNameFilter] = useState("");

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
    [questions]
  );

  const filteredItems = useMemo(() => {
    if (!nameFilter.trim()) {
      return items;
    }

    const searchTerm = nameFilter.trim().toLowerCase();
    return items.filter((item) => {
      const userName = item.user_name || "Guest / Anonymous";
      return userName.toLowerCase().includes(searchTerm);
    });
  }, [items, nameFilter]);

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

      <div className="space-y-1">
        <Label htmlFor="qa-filter-name">Search by Name</Label>
        <Input
          id="qa-filter-name"
          placeholder="Search by user name..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
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
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {nameFilter ? "No questions found matching the search criteria." : "No questions yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
              const statusLabel = getStatusLabel(item.is_approved, item.answer);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium max-w-md truncate">
                    {item.question}
                  </TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.user_name || "Guest / Anonymous"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(item.is_approved, item.answer)}
                      className="capitalize"
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
    </div>
  );
}
