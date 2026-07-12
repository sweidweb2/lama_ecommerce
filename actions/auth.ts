"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { logoutServerService } from "@/services/profile.service";

/**
 * Server action to log out the current user.
 * Clears the session on the server side and redirects to home.
 */
export async function logout() {
  const result = await logoutServerService();

  if (!result.success) {
    throw new Error(`Logout failed: ${result.error ?? "Unknown error"}`);
  }

  // Revalidate all paths to clear cached data
  revalidatePath("/", "layout");

  // Redirect to home page
  redirect(ROUTES.HOME);
}
