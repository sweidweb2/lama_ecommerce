"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createLeadSchema } from "@/lib/validators/lead/create";
import { updateLeadSchema } from "@/lib/validators/lead/update";
import {
  createLeadService,
  createLeadAdminService,
  getAllLeadsService,
  updateLeadService,
  deleteLeadService,
} from "@/services/lead.service";
import {
  checkFormRateLimit,
  getClientIpFromHeaders,
  LEAD_RATE_LIMIT,
} from "@/lib/rate-limit";

/** Public footer signup. */
export async function createLeadAction(formData: FormData) {
  // Honeypot: bots fill hidden "website" — fake success, do not insert
  const website = formData.get("website");
  if (typeof website === "string" && website.trim() !== "") {
    return { success: true as const };
  }

  const ip = await getClientIpFromHeaders();
  const allowed = await checkFormRateLimit({
    key: `lead:${ip}`,
    limit: LEAD_RATE_LIMIT.limit,
    windowSeconds: LEAD_RATE_LIMIT.windowSeconds,
  });

  if (!allowed) {
    return {
      success: false as const,
      error: "Too many submissions. Try again later.",
    };
  }

  const email = formData.get("email");
  const parsed = createLeadSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false as const, error: "Please enter a valid email address." };
  }
  const ok = await createLeadService(parsed.data);
  return ok
    ? { success: true as const }
    : { success: false as const, error: "Something went wrong. Please try again." };
}

/** Get all leads for admin. */
export async function getLeadsAction() {
  await requireAdmin();
  return await getAllLeadsService();
}

/** Create a lead as admin. Revalidates /admin/leads on success. */
export async function createLeadAdminAction(payload: { email: string }) {
  await requireAdmin();
  const parsed = createLeadSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false as const, error: "Please enter a valid email address." };
  }
  const created = await createLeadAdminService(parsed.data);
  if (!created) {
    return { success: false as const, error: "Failed to create lead." };
  }
  revalidatePath("/admin/leads");
  return { success: true as const, data: created };
}

/** Update a lead as admin. Revalidates /admin/leads on success. */
export async function updateLeadAction(payload: { id: string; email: string }) {
  await requireAdmin();
  const parsed = updateLeadSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false as const, error: "Please enter a valid email address." };
  }
  const ok = await updateLeadService(parsed.data);
  if (!ok) {
    return { success: false as const, error: "Failed to update lead." };
  }
  revalidatePath("/admin/leads");
  return { success: true as const };
}

/** Delete a lead as admin. Revalidates /admin/leads on success. */
export async function deleteLeadAction(id: string) {
  await requireAdmin();
  const ok = await deleteLeadService(id);
  if (!ok) {
    return { success: false as const, error: "Failed to delete lead." };
  }
  revalidatePath("/admin/leads");
  return { success: true as const };
}
