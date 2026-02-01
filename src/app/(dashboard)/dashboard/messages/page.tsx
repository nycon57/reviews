import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MessagesView } from "@/components/messages/messages-view";

export const metadata = {
  title: "Messages | RepWell",
  description: "Two-way SMS conversations with borrowers",
};

function MessagesLoadingSkeleton() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Conversation list skeleton */}
      <div className="w-80 border-r border-border flex-shrink-0">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        <div className="p-3 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Detail panel skeleton */}
      <div className="flex-1 flex items-center justify-center">
        <Skeleton className="h-16 w-64 rounded-lg" />
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesLoadingSkeleton />}>
      <MessagesView />
    </Suspense>
  );
}
