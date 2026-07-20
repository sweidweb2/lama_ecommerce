import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createSupabaseServerActionClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/server";
import type { ContactMessage, ContactStatus } from "@/types/user";
import type { CreateContactUsInput } from "@/lib/validators/contact_us/create";

export type ContactMessagesFilter = {
  name?: string;
  email?: string;
  from?: string;
  to?: string;
};

export type ListContactMessagesParams = ContactMessagesFilter & {
  page: number;
  pageSize: number;
};

export interface ListContactMessagesResult {
  items: ContactMessage[];
  total: number;
}

/**
 * Insert a new contact-us message (service role — public INSERT policy removed).
 */
export async function createContactMessage(
  input: CreateContactUsInput,
): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await (supabase as any)
      .from("contact_us")
      .insert(input);

    if (error) {
      console.error("Failed to create contact message:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in createContactMessage:", error);
    return false;
  }
}

function applyContactFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST builder chain
  query: any,
  filters?: ContactMessagesFilter,
) {
  if (filters?.name) {
    query = query.ilike("full_name", `%${filters.name}%`);
  }
  if (filters?.email) {
    query = query.ilike("email", `%${filters.email}%`);
  }
  if (filters?.from) {
    query = query.gte("created_at", filters.from);
  }
  if (filters?.to) {
    const toDate = filters.to.includes("T")
      ? filters.to
      : `${filters.to}T23:59:59.999Z`;
    query = query.lte("created_at", toDate);
  }
  return query;
}

/**
 * Paginated contact messages for admin list.
 */
export async function listContactMessages(
  params: ListContactMessagesParams,
): Promise<ListContactMessagesResult> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const page = Math.max(1, params.page);
    const pageSize = Math.min(Math.max(1, params.pageSize), 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("contact_us")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    query = applyContactFilters(query, params);

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("Failed to list contact messages:", error);
      return { items: [], total: 0 };
    }

    return { items: (data ?? []) as ContactMessage[], total: count ?? 0 };
  } catch (error) {
    console.error("Unexpected error in listContactMessages:", error);
    return { items: [], total: 0 };
  }
}

/**
 * All contact messages matching filters (admin CSV export).
 * Batches with .range to avoid PostgREST max_rows truncation.
 */
export async function listContactMessagesForExport(
  filters?: ContactMessagesFilter,
): Promise<ContactMessage[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const batchSize = 1000;
    const collected: ContactMessage[] = [];
    let offset = 0;

    for (;;) {
      let query = supabase
        .from("contact_us")
        .select("*")
        .order("created_at", { ascending: false });

      query = applyContactFilters(query, filters);

      const { data, error } = await query.range(
        offset,
        offset + batchSize - 1,
      );

      if (error) {
        console.error("Failed to export contact messages:", error);
        return collected;
      }

      const rows = (data ?? []) as ContactMessage[];
      collected.push(...rows);
      if (rows.length < batchSize) break;
      offset += batchSize;
    }

    return collected;
  } catch (error) {
    console.error("Unexpected error in listContactMessagesForExport:", error);
    return [];
  }
}

/**
 * Fetch all contact messages (admin use). Prefer listContactMessages for UI.
 */
export async function getAllContactMessages(
  filters?: ContactMessagesFilter,
): Promise<ContactMessage[]> {
  return listContactMessagesForExport(filters);
}

/**
 * Fetch a single contact message by ID (admin use).
 */
export async function getContactMessageById(
  id: string,
): Promise<ContactMessage | null> {
  try {
    const supabase = await createSupabaseServerComponentClient();

    const { data, error } = await supabase
      .from("contact_us")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch contact message:", error);
      return null;
    }

    return data as ContactMessage | null;
  } catch (error) {
    console.error("Unexpected error in getContactMessageById:", error);
    return null;
  }
}

/**
 * Update a contact message by ID.
 */
export async function updateContactMessage(
  id: string,
  input: CreateContactUsInput,
): Promise<ContactMessage | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { data, error } = await supabase
      .from("contact_us")
      .update(input as never)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update contact message:", error);
      return null;
    }

    return data as ContactMessage;
  } catch (error) {
    console.error("Unexpected error in updateContactMessage:", error);
    return null;
  }
}

/**
 * Update only the status of a contact message (e.g. new ↔ read).
 */
export async function updateContactMessageStatus(
  id: string,
  status: ContactStatus,
): Promise<ContactMessage | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { data, error } = await supabase
      .from("contact_us")
      .update({ status } as never)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update contact message status:", error);
      return null;
    }

    return data as ContactMessage;
  } catch (error) {
    console.error("Unexpected error in updateContactMessageStatus:", error);
    return null;
  }
}

/**
 * Delete a contact message by ID.
 */
export async function deleteContactMessage(
  id: string,
): Promise<ContactMessage | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { data, error } = await supabase
      .from("contact_us")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to delete contact message:", error);
      return null;
    }

    return data as ContactMessage;
  } catch (error) {
    console.error("Unexpected error in deleteContactMessage:", error);
    return null;
  }
}
