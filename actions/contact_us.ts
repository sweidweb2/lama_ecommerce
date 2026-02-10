"use server";

import { CreateContactUsInput } from "@/lib/validators/contact_us/create";
import {
  createContactUs,
  getAllContactUs,
  getContactUsById,
} from "@/services/contact_us.service";

export async function createContactUsAction(input: CreateContactUsInput) {
  return await createContactUs(input);
}

export async function getAllContactUsAction() {
  return await getAllContactUs();
}

export async function getContactUsByIdAction(id: string) {
  return await getContactUsById(id);
}
