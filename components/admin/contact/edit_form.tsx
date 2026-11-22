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
import {
  updateContactUsAction,
  updateContactStatusAction,
} from "@/actions/contact_us";
import { CONTACT_US_FIELD_MAX } from "@/lib/validators/contact_us/create";
import type { AdminContact } from "./create_form";

const CONTACT_STATUSES = ["new", "read", "replied", "resolved"] as const;

type EditValues = {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: AdminContact["status"];
};

interface EditContactDialogProps {
  contact: AdminContact;
}

export function EditContactDialog({ contact }: EditContactDialogProps) {
  const router = useRouter();

  return (
    <AdminFormDialog<EditValues>
      mode="edit"
      title="Edit Contact Message"
      triggerLabel={`Edit contact from ${contact.full_name || contact.email || contact.id}`}
      contentClassName="max-w-xl max-h-[90vh] overflow-y-auto"
      initialValues={{
        fullName: contact.full_name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        subject: contact.subject || "",
        message: contact.message || "",
        status: contact.status,
      }}
      submitLabel="Save Changes"
      toastMessages={{ errorTitle: "Failed to update contact" }}
      onSuccess={() => router.refresh()}
      onSubmit={async (values) => {
        const result = await updateContactUsAction(contact.id, {
          full_name: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || null,
          subject: values.subject.trim(),
          message: values.message.trim(),
        });
        if (!result.success) {
          return {
            success: false,
            error: result.error || "Failed to update contact",
          };
        }
        if (values.status !== contact.status) {
          try {
            await updateContactStatusAction(contact.id, values.status);
          } catch (err) {
            return {
              success: false,
              error:
                err instanceof Error
                  ? err.message
                  : "Failed to update contact status",
            };
          }
        }
        return { success: true };
      }}
    >
      {({ values, setValues }) => (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`contact-full-name-${contact.id}`}>
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`contact-full-name-${contact.id}`}
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
              <Label htmlFor={`contact-email-${contact.id}`}>
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`contact-email-${contact.id}`}
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
              <Label htmlFor={`contact-phone-${contact.id}`}>Phone</Label>
              <Input
                id={`contact-phone-${contact.id}`}
                value={values.phone}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+1234567890"
                maxLength={CONTACT_US_FIELD_MAX.phone}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`contact-subject-${contact.id}`}>
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`contact-subject-${contact.id}`}
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
            <Label htmlFor={`contact-message-${contact.id}`}>
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id={`contact-message-${contact.id}`}
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

          <div className="space-y-2">
            <Label htmlFor={`contact-status-${contact.id}`}>Status</Label>
            <Select
              value={values.status}
              onValueChange={(value) =>
                setValues((prev) => ({
                  ...prev,
                  status: value as AdminContact["status"],
                }))
              }
            >
              <SelectTrigger id={`contact-status-${contact.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
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
