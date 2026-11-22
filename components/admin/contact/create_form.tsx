"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";
import { createContactUsAction } from "@/actions/contact_us";
import { CONTACT_US_FIELD_MAX } from "@/lib/validators/contact_us/create";

export type AdminContact = {
  id: string;
  subject: string | null;
  message: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  status: "new" | "read" | "replied" | "resolved";
  created_at?: string;
};

type CreateValues = {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const INITIAL: CreateValues = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export function CreateContactDialog() {
  const router = useRouter();

  return (
    <AdminFormDialog<CreateValues>
      mode="create"
      title="Create Contact Message"
      triggerLabel="Create Contact"
      contentClassName="max-w-xl max-h-[90vh] overflow-y-auto"
      initialValues={INITIAL}
      submitLabel="Create"
      toastMessages={{ errorTitle: "Failed to create contact" }}
      onSuccess={() => router.refresh()}
      onSubmit={async (values) => {
        const result = await createContactUsAction({
          full_name: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || null,
          subject: values.subject.trim(),
          message: values.message.trim(),
        });
        if (!result.success) {
          return {
            success: false,
            error: result.error || "Failed to create contact",
          };
        }
        return { success: true };
      }}
    >
      {({ values, setValues }) => (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-full-name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-full-name"
                value={values.fullName}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="John Doe"
                maxLength={CONTACT_US_FIELD_MAX.full_name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                value={values.email}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="john.doe@example.com"
                maxLength={CONTACT_US_FIELD_MAX.email}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                value={values.phone}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+1234567890"
                maxLength={CONTACT_US_FIELD_MAX.phone}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-subject"
                value={values.subject}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="Subject"
                maxLength={CONTACT_US_FIELD_MAX.subject}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="contact-message"
              value={values.message}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Write the contact message here..."
              rows={5}
              maxLength={CONTACT_US_FIELD_MAX.message}
              required
            />
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
