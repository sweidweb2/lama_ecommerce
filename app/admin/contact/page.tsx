import { getAllContactUs } from "@/services/contact_us.service"
import type { ContactMessage } from "@/types/user"
import { ContactTableWithFilters } from "@/components/admin/contact/contact-table-with-filters"

export default async function ContactPage() {
  let contacts: ContactMessage[] = []
  let error: string | null = null

  try {
    contacts = await getAllContactUs()
  } catch (e) {
    console.error("Failed to load contact messages:", e)
    error = "Failed to load contact messages. Make sure you are signed in as an admin."
  }

  return <ContactTableWithFilters contacts={contacts} error={error} />
}
