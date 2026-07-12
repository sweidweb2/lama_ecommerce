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
import {
  checkFormRateLimit,
  getClientIpFromHeaders,
  CONTACT_RATE_LIMIT,
} from "@/lib/rate-limit";

export async function createContactUsAction(
  input: CreateContactUsInput & { website?: string },
) {
  // Honeypot: bots fill hidden "website" — fake success, do not insert
  if (input.website && input.website.trim() !== "") {
    return { success: true as const };
  }

  const ip = await getClientIpFromHeaders();
  const allowed = await checkFormRateLimit({
    key: `contact:${ip}`,
    limit: CONTACT_RATE_LIMIT.limit,
    windowSeconds: CONTACT_RATE_LIMIT.windowSeconds,
  });

  if (!allowed) {
    return {
      success: false as const,
      error: "Too many submissions. Try again later.",
    };
  }

  const { website: _website, ...contactInput } = input;
  await createContactUs(contactInput);
  return { success: true as const };
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
