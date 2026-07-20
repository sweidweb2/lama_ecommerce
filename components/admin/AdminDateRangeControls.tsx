"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "@/components/ui/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ADMIN_REPORTING_TZ_NOTE,
  type AdminDateRangePreset,
} from "@/lib/admin/date-range"
import { cn } from "@/lib/utils"

const PRESETS: Array<{ id: "this_month" | "last_30d" | "all"; label: string }> =
  [
    { id: "this_month", label: "This month" },
    { id: "last_30d", label: "Last 30 days" },
    { id: "all", label: "All time" },
  ]

interface AdminDateRangeControlsProps {
  fromDate: string
  toDate: string
  preset: AdminDateRangePreset
  /** Optional deep link shown beside the controls (e.g. Full charts). */
  chartsHref?: string
  className?: string
  /** Hide "All time" preset (dashboard defaults to bounded ranges). */
  showAllTime?: boolean
}

export function AdminDateRangeControls({
  fromDate,
  toDate,
  preset,
  chartsHref,
  className,
  showAllTime = true,
}: AdminDateRangeControlsProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [from, setFrom] = useState(fromDate)
  const [to, setTo] = useState(toDate)

  useEffect(() => {
    setFrom(fromDate)
    setTo(toDate)
  }, [fromDate, toDate])

  const navigate = useCallback(
    (params: URLSearchParams) => {
      const q = params.toString()
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    },
    [pathname, router],
  )

  const applyCustom = useCallback(() => {
    if (!from || !to) return
    const params = new URLSearchParams()
    params.set("from", from)
    params.set("to", to)
    navigate(params)
  }, [from, to, navigate])

  const applyPreset = useCallback(
    (id: "this_month" | "last_30d" | "all") => {
      const params = new URLSearchParams()
      params.set("preset", id)
      navigate(params)
    },
    [navigate],
  )

  const visiblePresets = showAllTime
    ? PRESETS
    : PRESETS.filter((p) => p.id !== "all")

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-wrap gap-2">
          {visiblePresets.map((p) => {
            const active = preset === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted/50",
                )}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="admin-range-from" className="text-xs">
              From
            </Label>
            <Input
              id="admin-range-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 w-[140px]"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="admin-range-to" className="text-xs">
              To
            </Label>
            <Input
              id="admin-range-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 w-[140px]"
            />
          </div>
          <button
            type="button"
            onClick={applyCustom}
            disabled={!from || !to}
            className="h-9 rounded-md border bg-background px-3 text-sm hover:bg-muted/50 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{ADMIN_REPORTING_TZ_NOTE}</span>
        {chartsHref ? (
          <Link href={chartsHref} className="font-medium text-primary hover:underline">
            Full charts
          </Link>
        ) : null}
      </div>
    </div>
  )
}
