"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { updateQuestionAction } from "@/actions/product_question";
import type { AdminQuestion } from "./create_form";

const APPROVAL_OPTIONS = [
  { value: "false", label: "Pending" },
  { value: "true", label: "Approved" },
];

interface EditQuestionDialogProps {
  question: AdminQuestion;
  showText?: boolean;
}

export function EditQuestionDialog({ question, showText = false }: EditQuestionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [questionText, setQuestionText] = useState<string>(question.question);
  const [answerText, setAnswerText] = useState<string>(question.answer || "");
  const [isApproved, setIsApproved] = useState<string>(question.is_approved ? "true" : "false");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await updateQuestionAction(question.id, {
        question: questionText.trim(),
        answer: answerText.trim() || null,
        is_approved: isApproved === "true",
      });
      if (!result.success) {
        setError(result.error ?? "Failed to update question");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setQuestionText(question.question);
    setAnswerText(question.answer || "");
    setIsApproved(question.is_approved ? "true" : "false");
    setError(null);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant={showText ? "outline" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Edit question ${question.id}`}
      >
        <Edit className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Edit"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question & Answer</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            {error && <p className="text-sm text-destructive">{error}</p>}
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
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`qa-answer-${question.id}`}>Answer</Label>
              <Textarea
                id={`qa-answer-${question.id}`}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`qa-approved-${question.id}`}>Approved</Label>
              <Select value={isApproved} onValueChange={setIsApproved}>
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

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!questionText.trim() || isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
