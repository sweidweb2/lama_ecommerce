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
import { Plus } from "lucide-react";
import { createQuestionAction } from "@/actions/product_question";

export type AdminQuestion = {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string | null;
  user_name: string | null;
  question: string;
  answer: string | null;
  is_approved: boolean;
  created_at?: string;
};

const NONE_VALUE = "__none__";

export interface ProductOption {
  id: string;
  name: string;
}
export interface ProfileOption {
  id: string;
  name: string;
}

interface CreateQuestionDialogProps {
  products: ProductOption[];
  profiles: ProfileOption[];
}

export function CreateQuestionDialog({ products, profiles }: CreateQuestionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<string>("");
  const [userId, setUserId] = useState<string>(NONE_VALUE);
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [isApproved, setIsApproved] = useState<string>("false");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !question.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await createQuestionAction({
        product_id: productId,
        user_id: userId !== NONE_VALUE ? userId : null,
        question: question.trim(),
        answer: answer.trim() || null,
        is_approved: isApproved === "true",
      });
      if (!result.success) {
        setError(result.error ?? "Failed to create question");
        return;
      }
      setProductId("");
      setUserId(NONE_VALUE);
      setQuestion("");
      setAnswer("");
      setIsApproved("false");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setProductId("");
    setUserId(NONE_VALUE);
    setQuestion("");
    setAnswer("");
    setIsApproved("false");
    setError(null);
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Question
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Question</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="qa-product">
                Product <span className="text-destructive">*</span>
              </Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger id="qa-product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qa-user">User (optional)</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger id="qa-user">
                  <SelectValue placeholder="Select a user or leave as guest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Guest / Anonymous</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qa-question">
                Question <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="qa-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Write the customer question here..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qa-answer">Answer (optional)</Label>
              <Textarea
                id="qa-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write the admin answer here..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qa-approved">Approved</Label>
              <Select value={isApproved} onValueChange={setIsApproved}>
                <SelectTrigger id="qa-approved">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Pending</SelectItem>
                  <SelectItem value="true">Approved</SelectItem>
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
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!productId || !question.trim()}
              >
                Create Question
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
