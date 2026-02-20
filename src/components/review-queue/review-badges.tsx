import { Badge } from "@/components/ui/badge";
import type { Review } from "@/lib/reviews/types";

export function getStatusBadge(status: Review["status"]) {
  const variants: Record<string, string> = {
    pending: "border-yellow-500 text-yellow-600 bg-yellow-50",
    approved: "border-green-500 text-green-600 bg-green-50",
    rejected: "border-red-500 text-red-600 bg-red-50",
    archived: "border-gray-400 text-gray-500 bg-gray-50",
  };
  return (
    <Badge variant="outline" className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function getSourceBadge(source: string) {
  const colors: Record<string, string> = {
    internal: "bg-blue-100 text-blue-700",
    google: "bg-red-100 text-red-700",
    zillow: "bg-purple-100 text-purple-700",
    facebook: "bg-indigo-100 text-indigo-700",
    yelp: "bg-orange-100 text-orange-700",
  };
  return (
    <Badge className={colors[source] || "bg-gray-100 text-gray-700"}>
      {source === "internal" ? "Survey" : source.charAt(0).toUpperCase() + source.slice(1)}
    </Badge>
  );
}

export function getSentimentBadge(label: string | null) {
  if (!label) return null;
  const colors: Record<string, string> = {
    positive: "bg-green-100 text-green-700",
    neutral: "bg-gray-100 text-gray-700",
    negative: "bg-red-100 text-red-700",
  };
  return (
    <Badge className={colors[label.toLowerCase()] || "bg-gray-100 text-gray-700"}>
      {label}
    </Badge>
  );
}
