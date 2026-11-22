"use client";

import { useRouter } from "next/navigation";
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
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";
import { createReviewAdminAction } from "@/actions/review";

export type AdminReview = {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string | null;
  user_name: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  review_status: "pending" | "approved" | "rejected";
  created_at?: string;
};

export interface ProductOption {
  id: string;
  name: string;
}

export interface ProfileOption {
  id: string;
  name: string;
}

interface CreateReviewDialogProps {
  products: ProductOption[];
  profiles: ProfileOption[];
}

const REVIEW_STATUSES: AdminReview["review_status"][] = ["pending", "approved", "rejected"];

const NONE_VALUE = "__none__";

type CreateValues = {
  productId: string;
  userId: string;
  rating: string;
  title: string;
  comment: string;
  status: AdminReview["review_status"];
};

const INITIAL: CreateValues = {
  productId: "",
  userId: NONE_VALUE,
  rating: "5",
  title: "",
  comment: "",
  status: "pending",
};

export function CreateReviewDialog({ products, profiles }: CreateReviewDialogProps) {
  const router = useRouter();

  return (
    <AdminFormDialog<CreateValues>
      mode="create"
      title="Create Review"
      triggerLabel="Create Review"
      contentClassName="max-w-xl max-h-[90vh] overflow-y-auto"
      initialValues={INITIAL}
      submitLabel="Create Review"
      toastMessages={{ errorTitle: "Failed to create review" }}
      onSuccess={() => router.refresh()}
      onSubmit={async (values) => {
        if (!values.productId) {
          return { success: false, error: "Please select a product" };
        }
        if (!values.rating) {
          return { success: false, error: "Rating is required" };
        }
        const result = await createReviewAdminAction({
          product_id: values.productId,
          user_id: values.userId !== NONE_VALUE ? values.userId : null,
          rating: Math.min(5, Math.max(1, parseInt(values.rating, 10) || 1)),
          title: values.title.trim() || null,
          comment: values.comment.trim() || null,
          review_status: values.status,
        });
        if (!result.success) {
          return {
            success: false,
            error: result.error ?? "Failed to create review",
          };
        }
        return { success: true };
      }}
    >
      {({ values, setValues }) => (
        <>
          <div className="space-y-2">
            <Label htmlFor="review-product">
              Product <span className="text-destructive">*</span>
            </Label>
            <Select
              value={values.productId}
              onValueChange={(value) =>
                setValues((prev) => ({ ...prev, productId: value }))
              }
            >
              <SelectTrigger id="review-product">
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
            <Label htmlFor="review-user">User (optional)</Label>
            <Select
              value={values.userId}
              onValueChange={(value) =>
                setValues((prev) => ({ ...prev, userId: value }))
              }
            >
              <SelectTrigger id="review-user">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="review-rating">
                Rating <span className="text-destructive">*</span>
              </Label>
              <Input
                id="review-rating"
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
              <Label htmlFor="review-status">Status</Label>
              <Select
                value={values.status}
                onValueChange={(value) =>
                  setValues((prev) => ({
                    ...prev,
                    status: value as AdminReview["review_status"],
                  }))
                }
              >
                <SelectTrigger id="review-status">
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
            <Label htmlFor="review-title">Title</Label>
            <Input
              id="review-title"
              value={values.title}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Short summary of the review"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-comment">Comment</Label>
            <Textarea
              id="review-comment"
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
