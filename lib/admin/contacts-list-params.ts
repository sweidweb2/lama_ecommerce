import type { ListContactMessagesParams } from "@/repositories/contact.repository";

export const ADMIN_CONTACTS_PAGE_SIZE = 20;

export type { ListContactMessagesParams };

export interface AdminContactsListSearchParams {
  page?: string;
  name?: string;
  email?: string;
  from?: string;
  to?: string;
}

export function parseAdminContactsListParams(
  params: AdminContactsListSearchParams,
  pageSize: number = ADMIN_CONTACTS_PAGE_SIZE,
): ListContactMessagesParams {
  return {
    page: Math.max(1, Number(params.page) || 1),
    pageSize: Math.min(Math.max(1, pageSize), 100),
    name: params.name?.trim() || undefined,
    email: params.email?.trim() || undefined,
    from: params.from?.trim() || undefined,
    to: params.to?.trim() || undefined,
  };
}
