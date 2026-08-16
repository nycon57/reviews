"use client";

import { ErrorState } from "@/components/shared/empty-state";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <ErrorState
        title="We couldn't load this dashboard page"
        description="Something interrupted this page. Try again, or contact support if it keeps happening."
        retry={reset}
        className="w-full max-w-2xl"
      />
    </div>
  );
}
