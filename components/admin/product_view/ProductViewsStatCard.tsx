import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductViewsStatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  borderColor: string
}

export function ProductViewsStatCard({
  title,
  value,
  description,
  icon: Icon,
  borderColor,
}: ProductViewsStatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm relative overflow-hidden">
      {/* Colorful left border */}
      <div 
        className={cn("absolute left-0 top-0 bottom-0 w-1")}
        style={{ backgroundColor: borderColor }}
      />
      
      <div className="flex items-center justify-between pl-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="rounded-full bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  )
}
