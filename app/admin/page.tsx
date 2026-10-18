import { redirect } from "next/navigation"
import { ROUTES } from "@/lib/constants/routes"

export default function AdminIndexPage() {
  redirect(ROUTES.ADMIN_HOME)
}
