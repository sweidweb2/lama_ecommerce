import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Lead } from "@/types/user";
import type { CreateLeadInput } from "@/lib/validators/lead/create";
import type { UpdateLeadInput } from "@/lib/validators/lead/update";

/**
 * Insert a new lead (e.g. newsletter signup). Uses server action client; RLS must allow public insert.
 */
export async function createLead(input: CreateLeadInput): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { error } = await supabase.from("leads").insert({ email: input.email });

    if (error) {
      console.error("Failed to create lead:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error in createLead:", err);
    return false;
  }
}

/**
 * Insert a new lead (admin use). Uses admin client (bypasses RLS).
 */
export async function createLeadAdmin(input: CreateLeadInput): Promise<Lead | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .insert({ email: input.email })
      .select("id, email, created_at")
      .single();

    if (error) {
      console.error("Failed to create lead (admin):", error);
      return null;
    }
    return data as Lead;
  } catch (err) {
    console.error("Unexpected error in createLeadAdmin:", err);
    return null;
  }
}

/**
 * Fetch all leads (admin use). Uses admin client (bypasses RLS).
 */
export async function getAllLeads(): Promise<Lead[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .select("id, email, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch leads:", error);
      return [];
    }
    return (data ?? []) as Lead[];
  } catch (err) {
    console.error("Unexpected error in getAllLeads:", err);
    return [];
  }
}

/**
 * Update a lead by id (admin use). Uses admin client (bypasses RLS).
 */
export async function updateLead(input: UpdateLeadInput): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("leads")
      .update({ email: input.email })
      .eq("id", input.id);

    if (error) {
      console.error("Failed to update lead:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error in updateLead:", err);
    return false;
  }
}

/**
 * Delete a lead by id (admin use). Uses admin client (bypasses RLS).
 */
export async function deleteLead(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("leads").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete lead:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error in deleteLead:", err);
    return false;
  }
}
