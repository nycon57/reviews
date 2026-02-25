import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignsLoading() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-7 w-12" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between pb-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, row) => (
            <div key={row} className="grid grid-cols-6 gap-3 py-2">
              <Skeleton className="col-span-2 h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
