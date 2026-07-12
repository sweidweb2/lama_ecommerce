import { Sidebar } from "@/components/admin/sidebar"
import { Header } from "@/components/admin/header"
import { AdminNavigationLoader } from "@/components/admin/admin-navigation-loader"

export const dynamic = "force-dynamic"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminNavigationLoader />
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
        <Sidebar />
      </aside>
      
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden md:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

