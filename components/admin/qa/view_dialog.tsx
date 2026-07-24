"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { submitAnswerAction } from "@/actions/product_question";
import type { AdminQuestion } from "./create_form";

interface ViewQuestionDialogProps {
  question: AdminQuestion;
}

export function ViewQuestionDialog({ question }: ViewQuestionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<string>(question.answer || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAnswer = Boolean(question.answer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await submitAnswerAction(question.id, answer.trim());
      if (!result.success) {
        setError(result.error ?? "Failed to submit answer");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`View question ${question.id}`}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question & Answer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Product</p>
                <p className="mt-1 font-medium text-foreground">{question.product_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">User</p>
                <p className="mt-1 text-foreground">
                  {question.user_name || "Guest / Anonymous"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Question</p>
              <div className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
                {question.question}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Answer</p>
              {hasAnswer ? (
                <div className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
                  {question.answer}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <p className="text-xs text-muted-foreground">
                    Submitting an answer also approves this question for the user pages.
                  </p>
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Write an answer to this question..."
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      loading={isSubmitting}
                      disabled={!answer.trim()}
                    >
                      Submit Answer
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
