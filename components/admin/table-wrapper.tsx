import { ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface TableWrapperProps {
  children: ReactNode
  isLoading?: boolean
  /** Thin top progress bar while keeping current rows visible (e.g. filter refresh). */
  isRefreshing?: boolean
  skeletonRows?: number
  skeletonCols?: number
  className?: string
}

export function TableWrapper({
  children,
  isLoading = false,
  isRefreshing = false,
  skeletonRows = 5,
  skeletonCols = 4,
  className,
}: TableWrapperProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-md border", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: skeletonCols }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: skeletonCols }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div
      className={cn("relative rounded-md border overflow-x-auto", className)}
      aria-busy={isRefreshing || undefined}
    >
      {isRefreshing ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-muted"
          role="progressbar"
          aria-label="Loading filtered results"
        >
          <div className="table-top-loader-bar h-full w-1/3 bg-primary" />
        </div>
      ) : null}
      {children}
    </div>
  )
}
