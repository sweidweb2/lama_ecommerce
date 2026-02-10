import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { CreateContactUsInput } from "@/lib/validators/contact_us/create";
import { supabase } from "@/lib/supabase/client";

export async function createContactUs(
  supabase: SupabaseClient<Database>,
  input: CreateContactUsInput,
) {
  const { data, error } = await supabase
    .from("contact_us")
    .insert(input as any)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAllContactUs() {
  const { data, error } = await supabase.from("contact_us").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getContactUsById(id: string) {
  const { data, error } = await supabase
    .from("contact_us")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function updateContactUs(id: string, input: CreateContactUsInput) {
  const { data, error } = await supabase
    .from("contact_us")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function deleteContactUs(id: string) {
  const { data, error } = await supabase
    .from("contact_us")
    .delete()
    .eq("id", id)
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
