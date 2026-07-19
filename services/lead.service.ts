import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createLead,
  createLeadAdmin,
  getAllLeads,
  listLeads,
  listLeadsForExport,
  updateLead,
  deleteLead,
  unsubscribeLeadByToken,
  type CreateLeadStatus,
  type CreateLeadAdminResult,
  type UpdateLeadResult,
  type UnsubscribeLeadResult,
  type ListLeadsParams,
  type ListLeadsResult,
} from "@/repositories/lead.repository";
import type { Lead } from "@/types/user";
import type { CreateLeadInput } from "@/lib/validators/lead/create";
import type { UpdateLeadInput } from "@/lib/validators/lead/update";

/** Public footer signup — no admin gate. */
export async function createLeadService(
  input: CreateLeadInput,
  userId?: string | null,
): Promise<CreateLeadStatus> {
  try {
    return await createLead(input, userId);
  } catch (error) {
    console.error("Unexpected error in createLeadService:", error);
    return "error";
  }
}

/** Public unsubscribe by token — no admin gate. */
export async function unsubscribeLeadByTokenService(
  token: string,
): Promise<UnsubscribeLeadResult> {
  try {
    return await unsubscribeLeadByToken(token);
  } catch (error) {
    console.error("Unexpected error in unsubscribeLeadByTokenService:", error);
    return { ok: false, error: "unknown" };
  }
}

export async function createLeadAdminService(
  input: CreateLeadInput,
): Promise<CreateLeadAdminResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "unknown" };
  }
  try {
    return await createLeadAdmin(input);
  } catch (error) {
    console.error("Unexpected error in createLeadAdminService:", error);
    return { ok: false, error: "unknown" };
  }
}

export async function getAllLeadsService(): Promise<Lead[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  try {
    return await getAllLeads();
  } catch (error) {
    console.error("Unexpected error in getAllLeadsService:", error);
    return [];
  }
}

export async function listLeadsService(
  params: ListLeadsParams,
): Promise<ListLeadsResult> {
  try {
    await requireAdmin();
  } catch {
    return { items: [], total: 0 };
  }
  try {
    return await listLeads(params);
  } catch (error) {
    console.error("Unexpected error in listLeadsService:", error);
    return { items: [], total: 0 };
  }
}

export async function exportLeadsService(query?: string): Promise<Lead[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  try {
    return await listLeadsForExport(query);
  } catch (error) {
    console.error("Unexpected error in exportLeadsService:", error);
    return [];
  }
}

export async function updateLeadService(
  input: UpdateLeadInput,
): Promise<UpdateLeadResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "unknown" };
  }
  try {
    return await updateLead(input);
  } catch (error) {
    console.error("Unexpected error in updateLeadService:", error);
    return { ok: false, error: "unknown" };
  }
}

export async function deleteLeadService(id: string): Promise<boolean> {
  try {
    await requireAdmin();
  } catch {
    return false;
  }
  try {
    return await deleteLead(id);
  } catch (error) {
    console.error("Unexpected error in deleteLeadService:", error);
    return false;
  }
}
