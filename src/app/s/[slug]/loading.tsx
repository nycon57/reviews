import { Skeleton } from "@/components/ui/skeleton";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <Skeleton className={`rounded-lg bg-repwell-sage-100/50 ${className}`} />;
}

export default function SmartLinkLoading() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background-subtle" aria-busy="true">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-repwell-sage-100/35 via-repwell-sage-100/10 to-transparent" />
        <div
          className="absolute inset-x-0 top-0 h-[420px] opacity-25"
          style={{
            backgroundImage: "radial-gradient(circle, #84a98c 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
      </div>

      <div
        role="status"
        className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-14"
      >
        <span className="sr-only">Loading smart link</span>
        <div className="grid grid-cols-1 gap-8 [grid-template-areas:'identity'_'quote'_'action'] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16 lg:gap-y-7 lg:[grid-template-areas:'quote_identity'_'quote_action']">
          <section className="min-w-0 [grid-area:quote] lg:self-center">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-0.5 w-8" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
            <div className="mt-5 space-y-4">
              <SkeletonBlock className="h-12 w-10 bg-repwell-sage-200/30 lg:h-14" />
              <SkeletonBlock className="h-8 w-full max-w-2xl" />
              <SkeletonBlock className="h-8 w-11/12 max-w-xl" />
              <SkeletonBlock className="h-8 w-4/5 max-w-lg" />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-9 w-9 rounded-full" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-32" />
                  <SkeletonBlock className="h-3 w-24" />
                </div>
              </div>
              <SkeletonBlock className="h-5 w-28" />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <SkeletonBlock className="h-3 w-10" />
              <SkeletonBlock className="h-11 w-16" />
              <SkeletonBlock className="h-11 w-24" />
              <SkeletonBlock className="h-11 w-20" />
              <SkeletonBlock className="h-11 w-20" />
            </div>
          </section>

          <section className="min-w-0 [grid-area:identity] lg:self-end">
            <div className="flex items-start gap-4">
              <SkeletonBlock className="h-16 w-16 rounded-full lg:h-20 lg:w-20" />
              <div className="min-w-0 flex-1 space-y-3 pt-0.5">
                <SkeletonBlock className="h-6 w-44" />
                <SkeletonBlock className="h-4 w-56 max-w-full" />
                <SkeletonBlock className="h-5 w-36" />
              </div>
            </div>
          </section>

          <section className="min-w-0 [grid-area:action] lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
              <div className="space-y-4 p-5 lg:p-6">
                <SkeletonBlock className="h-7 w-40" />
                <SkeletonBlock className="h-12 w-full rounded-xl" />
                <SkeletonBlock className="h-11 w-full rounded-xl" />
                <div className="h-px bg-border" />
                <div className="space-y-3">
                  <SkeletonBlock className="h-5 w-36" />
                  <SkeletonBlock className="h-5 w-48" />
                  <SkeletonBlock className="h-5 w-40" />
                </div>
              </div>
              <div className="border-t border-border bg-repwell-sage-50/50 px-5 py-3 lg:px-6">
                <SkeletonBlock className="mx-auto h-5 w-64 max-w-full" />
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 lg:mt-14">
          <div className="mx-auto mb-5 h-px w-12 bg-border" />
          <SkeletonBlock className="mx-auto h-11 w-64 max-w-full" />
        </div>
      </div>
    </main>
  );
}
