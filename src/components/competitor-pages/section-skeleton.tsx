import { cn } from "@/lib/utils";

interface SectionSkeletonProps {
  /** Height hint for the skeleton placeholder */
  height?: "sm" | "md" | "lg";
}

const heightClasses = {
  sm: "min-h-[200px]",
  md: "min-h-[400px]",
  lg: "min-h-[600px]",
} as const;

/**
 * Skeleton placeholder shown while a lazy-loaded section
 * is still being imported / hydrated.
 */
export function SectionSkeleton({ height = "md" }: SectionSkeletonProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        heightClasses[height],
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-6 w-48 animate-pulse rounded bg-repwell-sage-100/40" />
        <div className="h-4 w-72 animate-pulse rounded bg-repwell-sage-100/30" />
        <div className="h-4 w-60 animate-pulse rounded bg-repwell-sage-100/20" />
      </div>
    </div>
  );
}
