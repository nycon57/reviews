import { Badge } from "@/components/ui/badge";
import { SourceIcon } from "@/components/shared/review-item";
import type { Review } from "@/lib/reviews/types";
import { ReviewStatusBadge } from "@/components/reviews/review-status-badge";

export function getStatusBadge(status: Review["status"]) {
  return <ReviewStatusBadge status={status} />;
}

export function getSourceBadge(source: string) {
  return <SourceIcon source={source} />;
}

export function getSentimentBadge(label: string | null) {
  if (!label) return null;
  const colors: Record<string, string> = {
    positive: "bg-green-100 text-green-700",
    neutral: "bg-muted text-foreground",
    negative: "bg-red-100 text-red-700",
  };
  return (
    <Badge className={colors[label.toLowerCase()] || "bg-muted text-foreground"}>
      {label}
    </Badge>
  );
}
