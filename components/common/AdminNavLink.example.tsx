"use client";

/**
 * Example: Client component using permission helpers
 * 
 * This demonstrates how to use canAccessAdmin() in a client component
 * to conditionally show/hide admin UI elements.
 * 
 * Usage in your Header or Navigation component:
 * 
 * import { AdminNavLink } from "@/components/common/AdminNavLink";
 * 
 * <nav>
 *   <AdminNavLink />
 * </nav>
 */

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { ROUTES } from "@/lib/constants/routes";

export function AdminNavLink() {
  const { role } = useAuth();

  // Use permission helper to check if user can access admin
  if (!canAccessAdmin(role)) {
    // Hide admin link if user is not an admin
    return null;
  }

  // Show admin link only for admins
  return (
    <Link
      href={ROUTES.ADMIN}
      className="text-sm font-medium hover:text-primary"
    >
      Admin Panel
    </Link>
  );
}
