import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DirectorySkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-11 flex-1 bg-repwell-sage-100/30" />
            <Skeleton className="h-11 w-40 bg-repwell-sage-100/30" />
            <Skeleton className="h-11 w-40 bg-repwell-sage-100/30" />
            <Skeleton className="h-11 w-24 bg-repwell-sage-100/30" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-xl border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-full bg-repwell-sage-100/30" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32 bg-repwell-sage-100/30" />
                  <Skeleton className="h-4 w-24 bg-repwell-sage-100/30" />
                </div>
              </div>
              <Skeleton className="mt-4 h-4 w-40 bg-repwell-sage-100/30" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
