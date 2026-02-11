"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

  const pushParams = useCallback(
    (n: string, e: string, f: string, t: string) => {
      const params = new URLSearchParams()
      if (n) params.set("name", n)
      if (e) params.set("email", e)
      if (f) params.set("from", f)
      if (t) params.set("to", t)
      const q = params.toString()
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    },
    [pathname, router],
  )

  useEffect(() => {
    setName(initialName)
    setEmail(initialEmail)
    setFrom(initialFrom)
    setTo(initialTo)
  }, [initialName, initialEmail, initialFrom, initialTo])

  useEffect(() => {
    const t = setTimeout(() => pushParams(name, email, from, to), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [name, email, from, to, pushParams])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFrom(value)
    pushParams(name, email, value, to)
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTo(value)
    pushParams(name, email, from, value)
  }

  return (
    <div className="grid gap-4 md:grid-cols-4 items-end">
      <div className="space-y-1">
        <Label htmlFor="contact-filter-name">Name</Label>
        <Input
          id="contact-filter-name"
          placeholder="Search name"
          value={name}
          onChange={handleNameChange}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="contact-filter-email">Email</Label>
        <Input
          id="contact-filter-email"
          type="email"
          placeholder="Search email"
          value={email}
          onChange={handleEmailChange}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="contact-filter-from">From date</Label>
        <Input
          id="contact-filter-from"
          type="date"
          value={from}
          onChange={handleFromChange}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="contact-filter-to">To date</Label>
        <Input
          id="contact-filter-to"
          type="date"
          value={to}
          onChange={handleToChange}
        />
      </div>
    </div>
  )
}
