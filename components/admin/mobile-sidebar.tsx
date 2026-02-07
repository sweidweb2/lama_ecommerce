"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sidebar } from "./sidebar"
import { useState } from "react"

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 flex flex-col">
        <SheetHeader className="sr-only shrink-0">
          <SheetTitle>Admin Menu</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <Sidebar onLinkClick={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
