"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createContactUsSchema,
  type ContactUsFieldKey,
  type CreateContactUsInput,
} from "@/lib/validators/contact_us/create";
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

export type CreateContactUsActionResult =
  | { success: true }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<ContactUsFieldKey, string>>;
    };

export async function createContactUsAction(
  input: CreateContactUsInput & { website?: string },
): Promise<CreateContactUsActionResult> {
  // Honeypot: bots fill hidden "website" — fake success, do not insert
  if (input.website && input.website.trim() !== "") {
    return { success: true as const };
  }

  const { website: _website, ...contactInput } = input;
  const parsed = createContactUsSchema.safeParse(contactInput);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Partial<Record<ContactUsFieldKey, string>> = {};
    for (const key of Object.keys(flat) as ContactUsFieldKey[]) {
      const msg = flat[key]?.[0];
      if (msg) fieldErrors[key] = msg;
    }
    const firstKey = Object.keys(fieldErrors)[0] as
      | ContactUsFieldKey
      | undefined;
    return {
      success: false as const,
      error: (firstKey && fieldErrors[firstKey]) || "Invalid contact data",
      fieldErrors,
    };
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

  try {
    await createContactUs(parsed.data);
    return { success: true as const };
  } catch {
    return {
      success: false as const,
      error: "Failed to send message. Please try again.",
    };
  }
}

export async function updateContactUsAction(id: string, input: CreateContactUsInput) {
  await requireAdmin();
  const result = await updateContactUs(id, input);
  revalidatePath("/admin/contact");
  return result;
}

export async function deleteContactUsAction(id: string) {
  await requireAdmin();
  const result = await deleteContactUs(id);
  revalidatePath("/admin/contact");
  return result;
}

export async function getAllContactUsAction() {
  await requireAdmin();
  return await getAllContactUs();
}

export async function getContactUsByIdAction(id: string) {
  await requireAdmin();
  return await getContactUsById(id);
}

export async function updateContactStatusAction(id: string, status: ContactStatus) {
  await requireAdmin();
  const result = await updateContactStatus(id, status);
  revalidatePath("/admin/contact");
  return result;
}
