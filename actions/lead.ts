"use server";

import { revalidatePath } from "next/cache";
import { createLeadSchema } from "@/lib/validators/lead/create";
import { updateLeadSchema } from "@/lib/validators/lead/update";
import {
  createLead,
  createLeadAdmin,
  getAllLeads,
  updateLead,
  deleteLead,
} from "@/repositories/lead.repository";

/** Public footer signup. */
export async function createLeadAction(formData: FormData) {
  const email = formData.get("email");
  const parsed = createLeadSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false as const, error: "Please enter a valid email address." };
  }
  const ok = await createLead(parsed.data);
  return ok
    ? { success: true as const }
    : { success: false as const, error: "Something went wrong. Please try again." };
}

/** Get all leads for admin. */
export async function getLeadsAction() {
  return await getAllLeads();
}

/** Create a lead as admin. Revalidates /admin/leads on success. */
export async function createLeadAdminAction(payload: { email: string }) {
  const parsed = createLeadSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false as const, error: "Please enter a valid email address." };
  }
  const created = await createLeadAdmin(parsed.data);
  if (!created) {
    return { success: false as const, error: "Failed to create lead." };
  }
  revalidatePath("/admin/leads");
  return { success: true as const, data: created };
}

/** Update a lead as admin. Revalidates /admin/leads on success. */
export async function updateLeadAction(payload: { id: string; email: string }) {
  const parsed = updateLeadSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false as const, error: "Please enter a valid email address." };
  }
  const ok = await updateLead(parsed.data);
  if (!ok) {
    return { success: false as const, error: "Failed to update lead." };
  }
  revalidatePath("/admin/leads");
  return { success: true as const };
}

/** Delete a lead as admin. Revalidates /admin/leads on success. */
export async function deleteLeadAction(id: string) {
  const ok = await deleteLead(id);
  if (!ok) {
    return { success: false as const, error: "Failed to delete lead." };
  }
  revalidatePath("/admin/leads");
  return { success: true as const };
}
