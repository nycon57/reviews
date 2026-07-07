import {
  Clock,
  CheckCircle,
  XCircle,
  ShareNetwork as Share2,
  Star,
  WarningCircle,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============================================================================
// Shared Utility Functions
// ============================================================================

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================================================
// Sentiment Badge Component
// ============================================================================

export function SentimentBadge({ label }: { label: string | null }) {
  if (!label) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        label === "positive" && "border-repwell-sage-200/50 text-repwell-sage-200",
        label === "negative" && "border-[#c47c7c]/50 text-[#c47c7c]",
        label === "neutral" && "border-[#7c9eb8]/50 text-[#7c9eb8]"
      )}
    >
      {label}
    </Badge>
  );
}

// ============================================================================
// Quarantine (Needs Attention) Badge Component
// ============================================================================

export function QuarantineBadge() {
  return (
    <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-600">
      <WarningCircle className="h-3 w-3" weight="fill" />
      Low rating, needs review
    </Badge>
  );
}

// ============================================================================
// Customer Rating Stars Component
// ============================================================================

export function CustomerRatingStars({ rating }: { rating: number | null }) {
  if (rating === null) return null;

  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Customer rating: ${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          weight={value <= rating ? "fill" : "regular"}
          className={cn(
            "h-3.5 w-3.5",
            value <= rating ? "text-amber-500" : "text-muted-foreground/40"
          )}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Approval Status Badge Component
// ============================================================================

export function ApprovalStatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "outline" | "destructive";
      icon: typeof Clock;
    }
  > = {
    pending: { label: "Pending", variant: "secondary", icon: Clock },
    approved: { label: "Approved", variant: "default", icon: CheckCircle },
    rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
    published: { label: "Published", variant: "default", icon: Share2 },
  };

  const { label, variant, icon: Icon } = config[status] || config.pending;

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
