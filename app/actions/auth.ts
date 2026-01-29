"use server";

import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Server action to log out the current user.
 * Clears the session on the server side and redirects to home.
 */
export async function logout() {
  const supabase = await createSupabaseServerActionClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }

  // Revalidate all paths to clear cached data
  revalidatePath("/", "layout");
  
  // Redirect to home page
  redirect(ROUTES.HOME);
}
