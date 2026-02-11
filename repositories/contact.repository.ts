import {
  createSupabaseServerActionClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/server";
import type { ContactMessage } from "@/types/user";
import type { CreateContactUsInput } from "@/lib/validators/contact_us/create";

type ContactMessagesFilter = {
  name?: string;
  email?: string;
  from?: string;
  to?: string;
};

/**
 * Insert a new contact-us message into the database.
 *
 * Uses the Server Action client because this is a write operation
 * triggered from a form submission (Server Action).
 */
export async function createContactMessage(
  input: CreateContactUsInput,
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { error } = await supabase
      .from("contact_us") // ← your actual table name
      .insert(input as any);

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

/**
 * Fetch all contact messages (admin use).
 */
export async function getAllContactMessages(
  filters?: ContactMessagesFilter,
): Promise<ContactMessage[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();

    let query = supabase.from("contact_us").select("*");

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
      query = query.lte("created_at", filters.to);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch contact messages:", error);
      return [];
    }

    return (data ?? []) as ContactMessage[];
  } catch (error) {
    console.error("Unexpected error in getAllContactMessages:", error);
    return [];
  }
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
