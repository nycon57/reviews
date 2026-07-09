import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function PageHeaderSkeleton({
  withIcon = true,
  titleWidth = "w-40",
  subtitleWidth = "w-72",
  className,
}: {
  withIcon?: boolean;
  titleWidth?: string;
  subtitleWidth?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        withIcon ? "flex items-center gap-3" : "space-y-2",
        className
      )}
    >
      {withIcon && <Skeleton className="h-12 w-12 rounded-xl" />}
      <div className="space-y-2">
        <Skeleton className={cn("h-7", titleWidth)} />
        <Skeleton className={cn("h-4 max-w-full", subtitleWidth)} />
      </div>
    </div>
  );
}

export function ReviewsHubFallback() {
  return (
    <div className="space-y-6">
      <StatsRowSkeleton />
      <Skeleton className="h-10 w-80 max-w-full" />
      <Skeleton className="h-12 w-full" />
      <ReviewListSkeleton count={5} />
    </div>
  );
}

/**
 * Skeleton for metric/stat cards
 */
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader variant="plain" className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for a row of stat cards
 */
export function StatsRowSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for table rows
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 border-b py-3">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 ? "w-8" : i === columns - 1 ? "w-16" : "flex-1"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for data tables
 */
export function TableSkeleton({
  rows = 5,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader variant="plain" className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b bg-muted/50 px-6 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "h-3",
                i === 0 ? "w-8" : i === columns - 1 ? "w-16" : "flex-1"
              )}
            />
          ))}
        </div>
        {/* Table rows */}
        <div className="divide-y px-6">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for review cards
 */
export function ReviewCardSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for a list of review cards
 */
export function ReviewListSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for charts
 */
export function ChartSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader variant="plain" className="pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for sidebar navigation
 */
export function SidebarSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("flex h-full flex-col border-r bg-sidebar", className)}>
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="ml-2 h-5 w-24" />
      </div>

      {/* Navigation items */}
      <div className="flex-1 space-y-1 px-2 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
        <div className="py-3">
          <Skeleton className="h-px w-full" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i + 3} className="h-9 w-full rounded-md" />
        ))}
      </div>

      {/* Bottom items */}
      <div className="border-t px-2 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="mb-1 h-9 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

/**
 * Full page loading skeleton for dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <StatsRowSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}

/**
 * Inline loading spinner
 */
export function LoadingSpinner({ className }: SkeletonProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

/**
 * Page loading state with centered spinner
 */
export function PageLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
