import { Skeleton } from "@/components/ui/skeleton"

/**
 * PDP loading UI — shown until the full server page is ready.
 * Keeps layout stable so content does not flash then jump.
 */
export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 lg:pb-16 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16">
          <div className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-16 w-16 rounded-md" />
              <Skeleton className="h-16 w-16 rounded-md" />
              <Skeleton className="h-16 w-16 rounded-md" />
            </div>
          </div>

          <div className="space-y-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-8 w-28" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-12 rounded-md" />
                <Skeleton className="h-9 w-12 rounded-md" />
                <Skeleton className="h-9 w-12 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>

        <div className="mt-10 space-y-4 border-t pt-8">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
