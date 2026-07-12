import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createLead,
  createLeadAdmin,
  getAllLeads,
  updateLead,
  deleteLead,
} from "@/repositories/lead.repository";
import type { Lead } from "@/types/user";
import type { CreateLeadInput } from "@/lib/validators/lead/create";
import type { UpdateLeadInput } from "@/lib/validators/lead/update";

/** Public footer signup — no admin gate. */
export async function createLeadService(
  input: CreateLeadInput,
): Promise<boolean> {
  try {
    return await createLead(input);
  } catch (error) {
    console.error("Unexpected error in createLeadService:", error);
    return false;
  }
}

export async function createLeadAdminService(
  input: CreateLeadInput,
): Promise<Lead | null> {
  try {
    await requireAdmin();
  } catch {
    return null;
  }
  try {
    return await createLeadAdmin(input);
  } catch (error) {
    console.error("Unexpected error in createLeadAdminService:", error);
    return null;
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

export async function updateLeadService(
  input: UpdateLeadInput,
): Promise<boolean> {
  try {
    await requireAdmin();
  } catch {
    return false;
  }
  try {
    return await updateLead(input);
  } catch (error) {
    console.error("Unexpected error in updateLeadService:", error);
    return false;
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
