"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createLeadSchema } from "@/lib/validators/lead/create";
import { updateLeadSchema } from "@/lib/validators/lead/update";
import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import {
  createLeadService,
  createLeadAdminService,
  listLeadsService,
  exportLeadsService,
  updateLeadService,
  deleteLeadService,
  unsubscribeLeadByTokenService,
} from "@/services/lead.service";
import {
  checkFormRateLimit,
  getClientIpFromHeaders,
  LEAD_RATE_LIMIT,
} from "@/lib/rate-limit";

const DUPLICATE_LEAD_ERROR = "A lead with this email already exists.";

/** Public footer signup. */
export async function createLeadAction(formData: FormData) {
  // Honeypot: bots fill hidden "website" — fake success, do not insert
  const website = formData.get("website");
  if (typeof website === "string" && website.trim() !== "") {
    return { success: true as const, outcome: "created" as const };
  }

  const ip = await getClientIpFromHeaders();
  const allowed = await checkFormRateLimit({
    key: `lead:${ip}`,
    limit: LEAD_RATE_LIMIT.limit,
    windowSeconds: LEAD_RATE_LIMIT.windowSeconds,
  });

  if (!allowed) {
    return {
      success: false as const,
      error: "Too many submissions. Try again later.",
    };
  }

  const email = formData.get("email");
  const parsed = createLeadSchema.safeParse({ email });
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Please enter a valid email address.",
    };
  }

  const user = await getCurrentAuthUserFromAction();
  const status = await createLeadService(parsed.data, user?.id ?? null);
  if (status === "created") {
    return { success: true as const, outcome: "created" as const };
  }
  if (status === "resubscribed") {
    return { success: true as const, outcome: "resubscribed" as const };
  }
  if (status === "already_subscribed") {
    return { success: true as const, outcome: "already_subscribed" as const };
  }
  return {
    success: false as const,
    error: "Something went wrong. Please try again.",
  };
}

/** Paginated leads for admin list. */
export async function getLeadsPageAction(params: {
  page: number;
  pageSize: number;
  query?: string;
}) {
  await requireAdmin();
  return await listLeadsService({
    page: params.page,
    pageSize: params.pageSize,
    query: params.query,
  });
}

/** All leads matching query for admin CSV export. */
export async function exportLeadsAction(query?: string) {
  await requireAdmin();
  return await exportLeadsService(query);
}

/** @deprecated Prefer getLeadsPageAction / exportLeadsAction — kept for compatibility. */
export async function getLeadsAction() {
  await requireAdmin();
  return await exportLeadsService();
}

/** Create a lead as admin. Revalidates /admin/leads on success. */
export async function createLeadAdminAction(payload: { email: string }) {
  await requireAdmin();
  const parsed = createLeadSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Please enter a valid email address.",
    };
  }
  const result = await createLeadAdminService(parsed.data);
  if (!result.ok) {
    return {
      success: false as const,
      error:
        result.error === "duplicate"
          ? DUPLICATE_LEAD_ERROR
          : "Failed to create lead.",
    };
  }
  revalidatePath("/admin/leads");
  return { success: true as const, data: result.lead };
}

/** Update a lead as admin. Revalidates /admin/leads on success. */
export async function updateLeadAction(payload: { id: string; email: string }) {
  await requireAdmin();
  const parsed = updateLeadSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Please enter a valid email address.",
    };
  }
  const result = await updateLeadService(parsed.data);
  if (!result.ok) {
    return {
      success: false as const,
      error:
        result.error === "duplicate"
          ? DUPLICATE_LEAD_ERROR
          : "Failed to update lead.",
    };
  }
  revalidatePath("/admin/leads");
  return { success: true as const };
}

/** Delete a lead as admin. Revalidates /admin/leads on success. */
export async function deleteLeadAction(id: string) {
  await requireAdmin();
  const ok = await deleteLeadService(id);
  if (!ok) {
    return { success: false as const, error: "Failed to delete lead." };
  }
  revalidatePath("/admin/leads");
  return { success: true as const };
}

/** Public unsubscribe by token from marketing list emails / /unsubscribe. */
export async function unsubscribeLeadAction(token: string) {
  const trimmed = token?.trim() ?? "";
  if (!trimmed) {
    return {
      success: false as const,
      error: "Missing unsubscribe link. Please use the link from your email.",
    };
  }

  const uuidOk =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      trimmed,
    );
  if (!uuidOk) {
    return {
      success: false as const,
      error: "This unsubscribe link is invalid.",
    };
  }

  const result = await unsubscribeLeadByTokenService(trimmed);
  if (!result.ok) {
    if (result.error === "not_found") {
      return {
        success: false as const,
        error: "This unsubscribe link is invalid or has expired.",
      };
    }
    return {
      success: false as const,
      error: "Something went wrong. Please try again.",
    };
  }

  return {
    success: true as const,
    alreadyUnsubscribed: result.alreadyUnsubscribed,
  };
}
