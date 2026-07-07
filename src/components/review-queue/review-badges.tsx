import { Badge } from "@/components/ui/badge";
import { SourceIcon } from "@/components/shared/review-item";
import { REVIEW_STATUS_LABELS as STATUS_LABELS, type Review } from "@/lib/reviews/types";

export function getStatusBadge(status: Review["status"]) {
  const variants: Record<string, string> = {
    pending: "border-yellow-500 text-yellow-600 bg-yellow-50",
    approved: "border-green-500 text-green-600 bg-green-50",
    rejected: "border-red-500 text-red-600 bg-red-50",
    archived: "border-border text-muted-foreground bg-muted",
  };
  return (
    <Badge variant="outline" className={variants[status]}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
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
