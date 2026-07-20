import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  href?: string
  trend?: {
    value: string
    isPositive: boolean
  }
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  trend,
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 shadow-sm h-full",
        href &&
          "transition-colors hover:border-primary/40 focus-within:border-primary/40",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600",
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className="rounded-full bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  )

  if (!href) return content

  return (
    <Link href={href} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {content}
    </Link>
  )
}
