"use client";

import { useRouter } from "next/navigation";
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

type CreateValues = {
  productId: string;
  userId: string;
  question: string;
  answer: string;
  isApproved: string;
};

const INITIAL: CreateValues = {
  productId: "",
  userId: NONE_VALUE,
  question: "",
  answer: "",
  isApproved: "false",
};

export function CreateQuestionDialog({ products, profiles }: CreateQuestionDialogProps) {
  const router = useRouter();

  return (
    <AdminFormDialog<CreateValues>
      mode="create"
      title="Create Question"
      triggerLabel="Create Question"
      contentClassName="max-w-xl max-h-[90vh] overflow-y-auto"
      initialValues={INITIAL}
      submitLabel="Create Question"
      toastMessages={{ errorTitle: "Failed to create question" }}
      onSuccess={() => router.refresh()}
      onSubmit={async (values) => {
        if (!values.productId) {
          return { success: false, error: "Please select a product" };
        }
        if (!values.question.trim()) {
          return { success: false, error: "Question is required" };
        }
        const result = await createQuestionAction({
          product_id: values.productId,
          user_id: values.userId !== NONE_VALUE ? values.userId : null,
          question: values.question.trim(),
          answer: values.answer.trim() || null,
          is_approved: values.isApproved === "true",
        });
        if (!result.success) {
          return {
            success: false,
            error: result.error ?? "Failed to create question",
          };
        }
        return { success: true };
      }}
    >
      {({ values, setValues }) => (
        <>
          <div className="space-y-2">
            <Label htmlFor="qa-product">
              Product <span className="text-destructive">*</span>
            </Label>
            <Select
              value={values.productId}
              onValueChange={(value) =>
                setValues((prev) => ({ ...prev, productId: value }))
              }
            >
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
            <Select
              value={values.userId}
              onValueChange={(value) =>
                setValues((prev) => ({ ...prev, userId: value }))
              }
            >
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
              value={values.question}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, question: e.target.value }))
              }
              placeholder="Write the customer question here..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qa-answer">Answer (optional)</Label>
            <Textarea
              id="qa-answer"
              value={values.answer}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, answer: e.target.value }))
              }
              placeholder="Write the admin answer here..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qa-approved">Approved</Label>
            <Select
              value={values.isApproved}
              onValueChange={(value) =>
                setValues((prev) => ({ ...prev, isApproved: value }))
              }
            >
              <SelectTrigger id="qa-approved">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Pending</SelectItem>
                <SelectItem value="true">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
