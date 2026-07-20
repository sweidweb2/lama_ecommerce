import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createContactUsSchema,
  type ContactUsFieldKey,
  type CreateContactUsInput,
} from "@/lib/validators/contact_us/create";
import type { ContactMessage, ContactStatus } from "@/types/user";
import {
  createContactMessage,
  getAllContactMessages,
  listContactMessages,
  listContactMessagesForExport,
  getContactMessageById,
  updateContactMessage,
  updateContactMessageStatus,
  deleteContactMessage,
  type ContactMessagesFilter,
  type ListContactMessagesParams,
  type ListContactMessagesResult,
} from "@/repositories/contact.repository";

export type { ListContactMessagesParams, ListContactMessagesResult };

export type ContactUsMutationResult =
  | { success: true; data?: ContactMessage }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<ContactUsFieldKey, string>>;
    };

function flattenContactFieldErrors(error: z.ZodError): {
  error: string;
  fieldErrors: Partial<Record<ContactUsFieldKey, string>>;
} {
  const flat = error.flatten().fieldErrors as Partial<
    Record<ContactUsFieldKey, string[] | undefined>
  >;
  const fieldErrors: Partial<Record<ContactUsFieldKey, string>> = {};
  for (const key of Object.keys(flat) as ContactUsFieldKey[]) {
    const msg = flat[key]?.[0];
    if (msg) fieldErrors[key] = msg;
  }
  const firstKey = Object.keys(fieldErrors)[0] as ContactUsFieldKey | undefined;
  return {
    error: (firstKey && fieldErrors[firstKey]) || "Invalid contact data",
    fieldErrors,
  };
}

/**
 * Create a contact-us submission (validates then persists).
 * Public — no admin gate.
 */
export async function createContactUs(
  input: unknown,
): Promise<ContactUsMutationResult> {
  const parsed = createContactUsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, ...flattenContactFieldErrors(parsed.error) };
  }

  const ok = await createContactMessage(parsed.data as CreateContactUsInput);
  if (!ok) {
    return { success: false, error: "Failed to create contact message" };
  }
  return { success: true };
}

/**
 * Get all contact-us submissions (admin). Prefer listContactUs for paged UI.
 */
export async function getAllContactUs(filters?: ContactMessagesFilter) {
  await requireAdmin();
  return getAllContactMessages(filters);
}

/**
 * Paginated contact-us submissions (admin).
 */
export async function listContactUs(
  params: ListContactMessagesParams,
): Promise<ListContactMessagesResult> {
  await requireAdmin();
  return listContactMessages(params);
}

/**
 * All contact-us submissions matching filters for CSV export (admin).
 */
export async function exportContactUs(filters?: {
  name?: string;
  email?: string;
  from?: string;
  to?: string;
}) {
  await requireAdmin();
  return listContactMessagesForExport(filters);
}

/**
 * Get a single contact-us submission by id (admin).
 */
export async function getContactUsById(id: string) {
  await requireAdmin();
  const data = await getContactMessageById(id);
  if (!data) throw new Error("Contact message not found");
  return data;
}

/**
 * Update a contact-us submission (admin).
 */
export async function updateContactUs(
  id: string,
  input: unknown,
): Promise<ContactUsMutationResult> {
  await requireAdmin();

  const parsed = createContactUsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, ...flattenContactFieldErrors(parsed.error) };
  }

  const data = await updateContactMessage(
    id,
    parsed.data as CreateContactUsInput,
  );
  if (!data) {
    return { success: false, error: "Failed to update contact message" };
  }
  return { success: true, data };
}

/**
 * Update only the status of a contact message (e.g. new ↔ read).
 */
export async function updateContactStatus(id: string, status: ContactStatus) {
  await requireAdmin();
  const data = await updateContactMessageStatus(id, status);
  if (!data) throw new Error("Failed to update contact status");
  return data;
}

/**
 * Delete a contact-us submission (admin).
 */
export async function deleteContactUs(id: string) {
  await requireAdmin();
  const data = await deleteContactMessage(id);
  if (!data) throw new Error("Failed to delete contact message");
  return data;
}
