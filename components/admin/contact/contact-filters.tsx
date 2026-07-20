"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

const DEBOUNCE_MS = 300

interface ContactFiltersProps {
  initialName: string
  initialEmail: string
  initialFrom: string
  initialTo: string
}

export function ContactFilters({
  initialName,
  initialEmail,
  initialFrom,
  initialTo,
}: ContactFiltersProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [prevInitials, setPrevInitials] = useState({
    initialName,
    initialEmail,
    initialFrom,
    initialTo,
  })

  if (
    initialName !== prevInitials.initialName ||
    initialEmail !== prevInitials.initialEmail ||
    initialFrom !== prevInitials.initialFrom ||
    initialTo !== prevInitials.initialTo
  ) {
    setPrevInitials({ initialName, initialEmail, initialFrom, initialTo })
    setName(initialName)
    setEmail(initialEmail)
    setFrom(initialFrom)
    setTo(initialTo)
  }

  const pushParams = useCallback(
    (n: string, e: string, f: string, t: string) => {
      const params = new URLSearchParams()
      if (typeof window !== "undefined") {
        const id = new URLSearchParams(window.location.search).get("id")
        if (id) params.set("id", id)
      }
      if (n) params.set("name", n)
      if (e) params.set("email", e)
      if (f) params.set("from", f)
      if (t) params.set("to", t)
      // Drop page so filter changes return to page 1
      const q = params.toString()
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    },
    [pathname, router],
  )

  // Debounce URL updates from local filter state
  useEffect(() => {
    const timer = setTimeout(() => pushParams(name, email, from, to), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [name, email, from, to, pushParams])

  const hasActiveFilters =
    name.trim() !== "" || email.trim() !== "" || from !== "" || to !== ""

  const clearFilters = () => {
    setName("")
    setEmail("")
    setFrom("")
    setTo("")
    pushParams("", "", "", "")
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-4 md:grid-cols-4 items-end">
        <div className="space-y-1">
          <Label htmlFor="contact-filter-name">Name</Label>
          <Input
            id="contact-filter-name"
            placeholder="Search name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-filter-email">Email</Label>
          <Input
            id="contact-filter-email"
            type="email"
            placeholder="Search email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-filter-from">From date</Label>
          <Input
            id="contact-filter-from"
            type="date"
            value={from}
            onChange={(e) => {
              const value = e.target.value
              setFrom(value)
              pushParams(name, email, value, to)
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-filter-to">To date</Label>
          <Input
            id="contact-filter-to"
            type="date"
            value={to}
            onChange={(e) => {
              const value = e.target.value
              setTo(value)
              pushParams(name, email, from, value)
            }}
          />
        </div>
      </div>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" type="button" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
