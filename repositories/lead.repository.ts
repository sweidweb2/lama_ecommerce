import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Lead } from "@/types/user";
import type { CreateLeadInput } from "@/lib/validators/lead/create";
import type { UpdateLeadInput } from "@/lib/validators/lead/update";

export type CreateLeadStatus =
  | "created"
  | "already_subscribed"
  | "resubscribed"
  | "error";

export type CreateLeadAdminResult =
  | { ok: true; lead: Lead }
  | { ok: false; error: "duplicate" | "unknown" };

export type UpdateLeadResult =
  | { ok: true }
  | { ok: false; error: "duplicate" | "unknown" };

export type UnsubscribeLeadResult =
  | { ok: true; alreadyUnsubscribed: boolean }
  | { ok: false; error: "not_found" | "unknown" };

export type ListLeadsParams = {
  query?: string;
  page: number;
  pageSize: number;
};

export type ListLeadsResult = {
  items: Lead[];
  total: number;
};

const LEAD_SELECT =
  "id, email, user_id, status, source, unsubscribed_at, unsubscribe_token, created_at" as const;

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

/**
 * Insert a new lead (e.g. newsletter signup). Service role — public INSERT policy removed.
 * Duplicate normalized emails:
 * - unsubscribed → reactivate (resubscribed)
 * - subscribed → already_subscribed (idempotent for guests)
 * When userId is set and the email already exists with null user_id, backfill the link.
 */
export async function createLead(
  input: CreateLeadInput,
  userId?: string | null,
): Promise<CreateLeadStatus> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("leads").insert({
      email: input.email,
      user_id: userId ?? null,
      status: "subscribed",
      source: "footer",
      unsubscribed_at: null,
    });

    if (error) {
      if (isUniqueViolation(error)) {
        const { data: existing, error: fetchError } = await supabase
          .from("leads")
          .select(LEAD_SELECT)
          .eq("email", input.email)
          .maybeSingle();

        if (fetchError || !existing) {
          console.error("Failed to load lead after unique conflict:", fetchError);
          return "error";
        }

        if (userId && !existing.user_id) {
          const { error: backfillError } = await supabase
            .from("leads")
            .update({ user_id: userId })
            .eq("id", existing.id)
            .is("user_id", null);
          if (backfillError) {
            console.error("Failed to backfill lead user_id:", backfillError);
          }
        }

        if (existing.status === "unsubscribed") {
          const { error: reactivateError } = await supabase
            .from("leads")
            .update({
              status: "subscribed",
              unsubscribed_at: null,
              unsubscribe_token: crypto.randomUUID(),
              ...(userId && !existing.user_id ? { user_id: userId } : {}),
            })
            .eq("id", existing.id);

          if (reactivateError) {
            console.error("Failed to reactivate lead:", reactivateError);
            return "error";
          }
          return "resubscribed";
        }

        return "already_subscribed";
      }
      console.error("Failed to create lead:", error);
      return "error";
    }
    return "created";
  } catch (err) {
    console.error("Unexpected error in createLead:", err);
    return "error";
  }
}

/**
 * Insert a new lead (admin use). Uses admin client (bypasses RLS).
 */
export async function createLeadAdmin(
  input: CreateLeadInput,
): Promise<CreateLeadAdminResult> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .insert({
        email: input.email,
        user_id: null,
        status: "subscribed",
        source: "admin",
        unsubscribed_at: null,
      })
      .select(LEAD_SELECT)
      .single();

    if (error) {
      if (isUniqueViolation(error)) {
        return { ok: false, error: "duplicate" };
      }
      console.error("Failed to create lead (admin):", error);
      return { ok: false, error: "unknown" };
    }
    return { ok: true, lead: data as Lead };
  } catch (err) {
    console.error("Unexpected error in createLeadAdmin:", err);
    return { ok: false, error: "unknown" };
  }
}

/**
 * Mark a lead unsubscribed by public unsubscribe token (idempotent).
 */
export async function unsubscribeLeadByToken(
  token: string,
): Promise<UnsubscribeLeadResult> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: existing, error: fetchError } = await supabase
      .from("leads")
      .select(LEAD_SELECT)
      .eq("unsubscribe_token", token)
      .maybeSingle();

    if (fetchError) {
      console.error("Failed to load lead by unsubscribe token:", fetchError);
      return { ok: false, error: "unknown" };
    }
    if (!existing) {
      return { ok: false, error: "not_found" };
    }

    if (existing.status === "unsubscribed") {
      return { ok: true, alreadyUnsubscribed: true };
    }

    const { error: updateError } = await supabase
      .from("leads")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("Failed to unsubscribe lead:", updateError);
      return { ok: false, error: "unknown" };
    }

    return { ok: true, alreadyUnsubscribed: false };
  } catch (err) {
    console.error("Unexpected error in unsubscribeLeadByToken:", err);
    return { ok: false, error: "unknown" };
  }
}

/**
 * Paginated leads for admin list (service role).
 */
export async function listLeads(
  params: ListLeadsParams,
): Promise<ListLeadsResult> {
  try {
    const supabase = createSupabaseAdminClient();
    const page = Math.max(1, params.page);
    const pageSize = Math.min(Math.max(1, params.pageSize), 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const q = params.query?.trim() ?? "";

    let query = supabase
      .from("leads")
      .select(LEAD_SELECT, { count: "exact" })
      .order("created_at", { ascending: false });

    if (q) {
      query = query.ilike("email", `%${q}%`);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("Failed to list leads:", error);
      return { items: [], total: 0 };
    }
    return { items: (data ?? []) as Lead[], total: count ?? 0 };
  } catch (err) {
    console.error("Unexpected error in listLeads:", err);
    return { items: [], total: 0 };
  }
}

/**
 * All leads matching optional email query (admin CSV export).
 * Batches with .range to avoid PostgREST max_rows truncation.
 */
export async function listLeadsForExport(query?: string): Promise<Lead[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const q = query?.trim() ?? "";
    const batchSize = 1000;
    const collected: Lead[] = [];
    let offset = 0;

    for (;;) {
      let builder = supabase
        .from("leads")
        .select(LEAD_SELECT)
        .order("created_at", { ascending: false });

      if (q) {
        builder = builder.ilike("email", `%${q}%`);
      }

      const { data, error } = await builder.range(
        offset,
        offset + batchSize - 1,
      );

      if (error) {
        console.error("Failed to export leads:", error);
        return collected;
      }

      const rows = (data ?? []) as Lead[];
      collected.push(...rows);
      if (rows.length < batchSize) break;
      offset += batchSize;
    }

    return collected;
  } catch (err) {
    console.error("Unexpected error in listLeadsForExport:", err);
    return [];
  }
}

/**
 * Fetch all leads (admin use). Prefer listLeads for UI.
 */
export async function getAllLeads(): Promise<Lead[]> {
  return listLeadsForExport();
}

/**
 * Update a lead by id (admin use). Uses admin client (bypasses RLS).
 */
export async function updateLead(
  input: UpdateLeadInput,
): Promise<UpdateLeadResult> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("leads")
      .update({ email: input.email })
      .eq("id", input.id);

    if (error) {
      if (isUniqueViolation(error)) {
        return { ok: false, error: "duplicate" };
      }
      console.error("Failed to update lead:", error);
      return { ok: false, error: "unknown" };
    }
    return { ok: true };
  } catch (err) {
    console.error("Unexpected error in updateLead:", err);
    return { ok: false, error: "unknown" };
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
