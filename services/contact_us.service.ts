import {
  createContactUsSchema,
  type CreateContactUsInput,
} from "@/lib/validators/contact_us/create";
import {
  createContactMessage,
  getAllContactMessages,
  getContactMessageById,
  updateContactMessage,
  deleteContactMessage,
} from "@/repositories/contact.repository";

/**
 * Create a contact-us submission (validates then persists).
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
  const data = await getAllContactMessages();
  return data;
}

/**
 * Get a single contact-us submission by id (admin).
 */
export async function getContactUsById(id: string) {
  const data = await getContactMessageById(id);
  if (!data) throw new Error("Contact message not found");
  return data;
}

/**
 * Update a contact-us submission (admin).
 */
export async function updateContactUs(id: string, input: unknown) {
  const parsed = createContactUsSchema.parse(input) as CreateContactUsInput;
  const data = await updateContactMessage(id, parsed);
  if (!data) throw new Error("Failed to update contact message");
  return data;
}

/**
 * Delete a contact-us submission (admin).
 */
export async function deleteContactUs(id: string) {
  const data = await deleteContactMessage(id);
  if (!data) throw new Error("Failed to delete contact message");
  return data;
}
