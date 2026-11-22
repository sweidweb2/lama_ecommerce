"use client";

import { useRouter } from "next/navigation";
import { AdminDeleteDialog } from "@/components/admin/shared/admin-delete-dialog";
import { deleteQuestionAction } from "@/actions/product_question";
import type { AdminQuestion } from "./create_form";

interface DeleteQuestionDialogProps {
  question: Pick<AdminQuestion, "id" | "product_name" | "question">;
  onDelete?: (questionId: string) => void | Promise<void>;
  showText?: boolean;
}

export function DeleteQuestionDialog({
  question,
  onDelete,
  showText = false,
}: DeleteQuestionDialogProps) {
  const router = useRouter();

  return (
    <AdminDeleteDialog
      title="Delete Question"
      entityLabel="question"
      ariaLabel={`Delete question ${question.id}`}
      confirmLabel="Delete Question"
      showText={showText}
      toastMessages={{ errorTitle: "Failed to delete question" }}
      description={
        <>
          <p>
            Are you sure you want to delete the question about{" "}
            <span className="font-semibold text-foreground">{question.product_name}</span>?
          </p>
          <p className="line-clamp-2">&quot;{question.question}&quot;</p>
          <p>This action cannot be undone.</p>
        </>
      }
      onConfirm={async () => {
        try {
          if (onDelete) {
            await onDelete(question.id);
          } else {
            const result = await deleteQuestionAction(question.id);
            if (!result.success) {
              return {
                success: false as const,
                error: result.error ?? "Failed to delete question",
              };
            }
          }
        } catch (err) {
          return {
            success: false as const,
            error: err instanceof Error ? err.message : "Failed to delete question",
          };
        }
        router.refresh();
        return { success: true as const };
      }}
    />
  );
}
