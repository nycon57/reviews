import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicProfileLoadingProps {
  variant?: "profile" | "listing";
}

function ReviewSkeletons() {
  return (
    <Card className="border-t-4 border-t-repwell-sage-200">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function PublicProfileLoading({
  variant = "profile",
}: PublicProfileLoadingProps) {
  if (variant === "listing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="border-b bg-card">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-xl space-y-4 text-center">
              <Skeleton className="mx-auto h-10 w-64" />
              <Skeleton className="mx-auto h-5 w-80 max-w-full" />
            </div>
          </div>
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Skeleton className="h-48 w-full rounded-none md:h-64" />

      <div className="relative z-10 -mt-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-white p-6 shadow-lg md:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <Skeleton className="h-28 w-28 rounded-2xl md:h-32 md:w-32" />
              <div className="w-full flex-1 space-y-3 text-center sm:text-left">
                <Skeleton className="mx-auto h-8 w-64 sm:mx-0" />
                <Skeleton className="mx-auto h-4 w-44 sm:mx-0" />
                <div className="flex justify-center gap-3 sm:justify-start">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <Skeleton className="hidden h-20 w-40 sm:block" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={index}
                className="border-t-4 border-t-repwell-sage-200"
              >
                <CardContent className="space-y-4 p-6">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-2">
            <ReviewSkeletons />
          </div>
        </div>
      </div>
    </div>
  );
}
