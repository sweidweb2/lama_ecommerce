"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit } from "lucide-react";
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";
import { updateQuestionAction } from "@/actions/product_question";
import type { AdminQuestion } from "./create_form";

const APPROVAL_OPTIONS = [
  { value: "false", label: "Pending" },
  { value: "true", label: "Approved" },
];

type EditValues = {
  questionText: string;
  answerText: string;
  isApproved: string;
};

interface EditQuestionDialogProps {
  question: AdminQuestion;
  showText?: boolean;
}

export function EditQuestionDialog({ question, showText = false }: EditQuestionDialogProps) {
  const router = useRouter();

  return (
    <AdminFormDialog<EditValues>
      mode="edit"
      title="Edit Question & Answer"
      contentClassName="max-w-xl max-h-[90vh] overflow-y-auto"
      trigger={({ open }) => (
        <Button
          variant={showText ? "outline" : "ghost"}
          size={showText ? "default" : "icon"}
          onClick={open}
          aria-label={`Edit question ${question.id}`}
        >
          <Edit className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
          {showText && "Edit"}
        </Button>
      )}
      initialValues={{
        questionText: question.question,
        answerText: question.answer || "",
        isApproved: question.is_approved ? "true" : "false",
      }}
      submitLabel="Save Changes"
      toastMessages={{ errorTitle: "Failed to update question" }}
      onSuccess={() => router.refresh()}
      onSubmit={async (values) => {
        if (!values.questionText.trim()) {
          return { success: false, error: "Question is required" };
        }
        const result = await updateQuestionAction(question.id, {
          question: values.questionText.trim(),
          answer: values.answerText.trim() || null,
          is_approved: values.isApproved === "true",
        });
        if (!result.success) {
          return {
            success: false,
            error: result.error ?? "Failed to update question",
          };
        }
        return { success: true };
      }}
    >
      {({ values, setValues }) => (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <p className="text-sm font-medium text-foreground">
                {question.product_name}
              </p>
            </div>
            <div className="space-y-2">
              <Label>User</Label>
              <p className="text-sm text-foreground">
                {question.user_name || "Guest / Anonymous"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`qa-question-${question.id}`}>
              Question <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id={`qa-question-${question.id}`}
              value={values.questionText}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, questionText: e.target.value }))
              }
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`qa-answer-${question.id}`}>Answer</Label>
            <Textarea
              id={`qa-answer-${question.id}`}
              value={values.answerText}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, answerText: e.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`qa-approved-${question.id}`}>Approved</Label>
            <Select
              value={values.isApproved}
              onValueChange={(value) =>
                setValues((prev) => ({ ...prev, isApproved: value }))
              }
            >
              <SelectTrigger id={`qa-approved-${question.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPROVAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
