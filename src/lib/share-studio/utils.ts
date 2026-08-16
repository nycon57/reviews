import { formatReviewSource } from "@/lib/reviews/source-labels";

/**
 * Returns a human-readable platform label with "Review" suffix.
 * e.g. "google" -> "Google Review", "" -> "Verified Review".
 */
export function platformLabel(source: string): string {
  const s = source.toLowerCase().replace(/[\s-]+/g, "_");
  if (s === "video_testimonial") return "Video Testimonial";
  if (s === "realtor") return "Realtor.com Review";
  if (s) return `${formatReviewSource(source)} Review`;
  return "Verified Review";
}
