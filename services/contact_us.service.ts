import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createContactUsSchema,
  type CreateContactUsInput,
} from "@/lib/validators/contact_us/create";
import type { ContactStatus } from "@/types/user";
import {
  createContactMessage,
  getAllContactMessages,
  getContactMessageById,
  updateContactMessage,
  updateContactMessageStatus,
  deleteContactMessage,
} from "@/repositories/contact.repository";

/**
 * Create a contact-us submission (validates then persists).
 * Public — no admin gate.
 */
export async function createContactUs(input: unknown) {
  const parsed = createContactUsSchema.parse(input) as CreateContactUsInput;
  const ok = await createContactMessage(parsed);
  if (!ok) throw new Error("Failed to create contact message");
  return { success: true };
}

/**
 * Get all contact-us submissions (admin).
 */
export async function getAllContactUs() {
  await requireAdmin();
  return getAllContactMessages();
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
export async function updateContactUs(id: string, input: unknown) {
  await requireAdmin();
  const parsed = createContactUsSchema.parse(input) as CreateContactUsInput;
  const data = await updateContactMessage(id, parsed);
  if (!data) throw new Error("Failed to update contact message");
  return data;
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
