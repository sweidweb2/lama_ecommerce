"use server";

import { revalidatePath } from "next/cache";
import { CreateContactUsInput } from "@/lib/validators/contact_us/create";
import type { ContactStatus } from "@/types/user";
import {
  createContactUs,
  getAllContactUs,
  getContactUsById,
  updateContactUs,
  updateContactStatus,
  deleteContactUs,
} from "@/services/contact_us.service";

export async function createContactUsAction(input: CreateContactUsInput) {
  return await createContactUs(input);
}

export async function updateContactUsAction(id: string, input: CreateContactUsInput) {
  const result = await updateContactUs(id, input);
  revalidatePath("/admin/contact");
  return result;
}

export async function deleteContactUsAction(id: string) {
  const result = await deleteContactUs(id);
  revalidatePath("/admin/contact");
  return result;
}

export async function getAllContactUsAction() {
  return await getAllContactUs();
}

export async function getContactUsByIdAction(id: string) {
  return await getContactUsById(id);
}

export async function updateContactStatusAction(id: string, status: ContactStatus) {
  const result = await updateContactStatus(id, status);
  revalidatePath("/admin/contact");
  return result;
}
