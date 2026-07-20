import { listContactUs } from "@/services/contact_us.service"
import type { ContactMessage } from "@/types/user"
import { ContactTableWithFilters } from "@/components/admin/contact/contact-table-with-filters"
import {
  ADMIN_CONTACTS_PAGE_SIZE,
  parseAdminContactsListParams,
} from "@/lib/admin/contacts-list-params"

interface ContactPageProps {
  searchParams: Promise<{
    page?: string
    name?: string
    email?: string
    from?: string
    to?: string
    id?: string
  }>
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams
  const listParams = parseAdminContactsListParams(
    params,
    ADMIN_CONTACTS_PAGE_SIZE,
  )

  let contacts: ContactMessage[] = []
  let totalCount = 0
  let error: string | null = null

  try {
    const result = await listContactUs(listParams)
    contacts = result.items
    totalCount = result.total
  } catch (e) {
    console.error("Failed to load contact messages:", e)
    error =
      "Failed to load contact messages. Make sure you are signed in as an admin."
  }

  return (
    <ContactTableWithFilters
      contacts={contacts}
      totalCount={totalCount}
      page={listParams.page}
      pageSize={listParams.pageSize}
      error={error}
      initialName={listParams.name ?? ""}
      initialEmail={listParams.email ?? ""}
      initialFrom={listParams.from ?? ""}
      initialTo={listParams.to ?? ""}
    />
  )
}
