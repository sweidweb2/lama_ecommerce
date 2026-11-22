import { AppSidebar } from "@/components/admin/app-sidebar"
import { AdminHeader } from "@/components/admin/header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export const dynamic = "force-dynamic"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider className="!h-svh !min-h-0 overflow-hidden bg-sidebar">
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden bg-background md:m-2 md:ml-0 md:max-h-[calc(100svh-1rem)] md:rounded-xl md:shadow-sm md:peer-data-[state=collapsed]:ml-2">
        <AdminHeader />
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
