"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";
import { updateReviewAction } from "@/actions/review";
import type { AdminReview } from "./create_form";

const REVIEW_STATUSES: AdminReview["review_status"][] = ["pending", "approved", "rejected"];

type EditValues = {
  rating: string;
  title: string;
  comment: string;
  status: AdminReview["review_status"];
};

interface EditReviewDialogProps {
  review: AdminReview;
  showText?: boolean;
}

export function EditReviewDialog({ review, showText = false }: EditReviewDialogProps) {
  const router = useRouter();

  return (
    <AdminFormDialog<EditValues>
      mode="edit"
      title="Edit Review"
      contentClassName="max-w-xl max-h-[90vh] overflow-y-auto"
      trigger={({ open }) => (
        <Button
          variant={showText ? "outline" : "ghost"}
          size={showText ? "default" : "icon"}
          onClick={open}
          aria-label={`Edit review ${review.id}`}
        >
          <Edit className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
          {showText && "Edit"}
        </Button>
      )}
      initialValues={{
        rating: review.rating.toString(),
        title: review.title || "",
        comment: review.comment || "",
        status: review.review_status,
      }}
      submitLabel="Save Changes"
      toastMessages={{ errorTitle: "Error" }}
      onSuccess={() => router.refresh()}
      onSubmit={async (values) => {
        const result = await updateReviewAction(review.id, {
          rating: Math.min(5, Math.max(1, parseInt(values.rating) || 1)),
          title: values.title.trim() || null,
          comment: values.comment.trim() || null,
          review_status: values.status,
        });
        if (!result.success) {
          return {
            success: false,
            error: result.error || "Failed to update review",
          };
        }
        toast.success("Review updated", {
          description: "The review has been successfully updated.",
        });
        return { success: true };
      }}
    >
      {({ values, setValues }) => (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <p className="text-sm font-medium text-foreground">
                {review.product_name}
              </p>
            </div>
            <div className="space-y-2">
              <Label>User</Label>
              <p className="text-sm text-foreground">
                {review.user_name || "Guest / Anonymous"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`review-rating-${review.id}`}>
                Rating <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`review-rating-${review.id}`}
                type="number"
                min={1}
                max={5}
                value={values.rating}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, rating: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`review-status-${review.id}`}>Status</Label>
              <Select
                value={values.status}
                onValueChange={(value) =>
                  setValues((prev) => ({
                    ...prev,
                    status: value as AdminReview["review_status"],
                  }))
                }
              >
                <SelectTrigger id={`review-status-${review.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`review-title-${review.id}`}>Title</Label>
            <Input
              id={`review-title-${review.id}`}
              value={values.title}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Short summary of the review"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`review-comment-${review.id}`}>Comment</Label>
            <Textarea
              id={`review-comment-${review.id}`}
              value={values.comment}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, comment: e.target.value }))
              }
              placeholder="Write the review comment here..."
              rows={4}
            />
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
